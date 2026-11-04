import type { Ply_Property } from "./gs-loader"
import type { Ply_Parser_Output } from "./gs-parser"

declare const postMessage: Worker["postMessage"]


/**
 * Compressed ply (PlayCanvas / splat-transform format)
 *
 * Header layout (binary_little_endian):
 *
 *   element chunk N            N = ceil(M / 256), one chunk per 256 consecutive splats
 *     property float min_x     position bounds
 *     property float min_y
 *     property float min_z
 *     property float max_x
 *     property float max_y
 *     property float max_z
 *     property float min_scale_x   log-scale bounds
 *     property float min_scale_y
 *     property float min_scale_z
 *     property float max_scale_x
 *     property float max_scale_y
 *     property float max_scale_z
 *     property float min_r     color bounds (optional, older files have none -> 0..1)
 *     property float min_g
 *     property float min_b
 *     property float max_r
 *     property float max_g
 *     property float max_b
 *   element vertex M
 *     property uint packed_position
 *     property uint packed_rotation
 *     property uint packed_scale
 *     property uint packed_color
 *   element sh M               optional, uchar f_rest_* (higher SH bands), ignored here
 *
 * Splat i belongs to chunk i >> 8. Every packed field is a normalized
 * value t in [0, 1] interpolated between chunk's min and max: lerp(min, max, t).
 *
 * packed_position, 11-10-11 bits (MSB -> LSB):
 *   [31..21] x / 2047   [20..11] y / 1023   [10..0] z / 2047
 *
 * packed_scale, 11-10-11 bits, same layout as position.
 *   Result is in log space, real scale = exp(lerp(min_scale, max_scale, t))
 *
 * packed_color, 8-8-8-8 bits:
 *   [31..24] r   [23..16] g   [15..8] b   [7..0] a   (each / 255)
 *   rgb is lerp(min_rgb, max_rgb, t) = f_dc * SH_C0 + 0.5 (base color, not raw SH)
 *   a is already sigmoid(opacity), no chunk bounds
 *
 * packed_rotation, 2-10-10-10 bits, "smallest three" quaternion encoding:
 *   [31..30] index of the largest component (in rot_0..rot_3 order, rot_0 = w)
 *   [29..20] [19..10] [9..0] remaining 3 components in order,
 *     each decoded as (v / 1023 - 0.5) * sqrt(2), i.e. in [-1/sqrt(2), 1/sqrt(2)]
 *   largest component = sqrt(1 - a² - b² - c²), always positive
 */

export type Ply_Decompresser_Input_Chunks = {
  type:  "chunks"
  props: Ply_Property[]
  data:  Float32Array
  count: number
}

export type Ply_Decompresser_Input_Data = {
  type:   "data"
  data:   Uint32Array
  count:  number
  offset: number
}


export function decompresser_worker() {

  const CHUNK_SIZE_LOG2 = 8 // 256 splats per chunk
  const VERTEX_LEN = 4
  const ROT_NORM = 1 / (Math.SQRT2 * 0.5)

  let chunks: Float32Array = null!
  let chunk_len = 0

  /** -1 means missing prop */
  const chunk_prop_offset: Record<Ply_Property["name"], number> = {
    min_x:       0,
    min_y:       0,
    min_z:       0,
    max_x:       0,
    max_y:       0,
    max_z:       0,
    min_scale_x: 0,
    min_scale_y: 0,
    min_scale_z: 0,
    max_scale_x: 0,
    max_scale_y: 0,
    max_scale_z: 0,
    min_r:       0,
    min_g:       0,
    min_b:       0,
    max_r:       0,
    max_g:       0,
    max_b:       0,
  }

  const message_is_chunks = (data: any): data is Ply_Decompresser_Input_Chunks => {
    return data?.type === "chunks"
  }

  const message_is_data = (data: any): data is Ply_Decompresser_Input_Data => {
    return data?.type === "data"
  }

  const output: Ply_Parser_Output = {
    count:    0,
    offset:   0,
    position: null!,
    rotation: null!,
    scale:    null!,
    color:    null!,
  }

  const transfer: ArrayBuffer[] = Array(4).fill(new ArrayBuffer)

  const quat = new Float32Array(4)


  onmessage = (e: MessageEvent<Ply_Decompresser_Input_Chunks | Ply_Decompresser_Input_Data>) => {
    if (message_is_chunks(e.data)) {
      const props = e.data.props
      for (const name in chunk_prop_offset) {
        chunk_prop_offset[name] = props.findIndex(p => p.name === name)
      }
      chunk_len = props.length
      chunks = e.data.data
      return
    }

    if (message_is_data(e.data)) {
      decompress_data(e.data)
    }
  }

  /** chunk prop value, or fallback if prop is missing */
  const chunk_get = (ic: number, name: string, fallback: number): number => {
    const o = chunk_prop_offset[name]
    return o === -1 ? fallback : chunks[ic + o]
  }

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

  const unpack_rot = (v: number): void => {
    const a = (((v >>> 20) & 1023) / 1023 - 0.5) * ROT_NORM
    const b = (((v >>> 10) & 1023) / 1023 - 0.5) * ROT_NORM
    const c = ((v & 1023) / 1023 - 0.5) * ROT_NORM
    const m = Math.sqrt(Math.max(0, 1 - (a * a + b * b + c * c)))
    // components are in ply order: rot_0 (w), rot_1 (x), rot_2 (y), rot_3 (z)
    switch (v >>> 30) {
      case 0: quat[0] = m; quat[1] = a; quat[2] = b; quat[3] = c; break
      case 1: quat[0] = a; quat[1] = m; quat[2] = b; quat[3] = c; break
      case 2: quat[0] = a; quat[1] = b; quat[2] = m; quat[3] = c; break
      default: quat[0] = a; quat[1] = b; quat[2] = c; quat[3] = m; break
    }
  }

  const decompress_data = (msg: Ply_Decompresser_Input_Data) => {
    const data = msg.data
    const count = msg.count
    const offset = msg.offset

    const position = new Float32Array(count * 3 | 0)
    const scale    = new Float32Array(count * 3 | 0)

    const rotation = new Float32Array(count << 2)
    const color    = new Float32Array(count << 2)

    let last_chunk = -1
    let min_x = 0, min_y = 0, min_z = 0, max_x = 0, max_y = 0, max_z = 0
    let min_sx = 0, min_sy = 0, min_sz = 0, max_sx = 0, max_sy = 0, max_sz = 0
    let min_r = 0, min_g = 0, min_b = 0, max_r = 1, max_g = 1, max_b = 1

    for (let i = 0; i < count; i++) {
      const iv = i * VERTEX_LEN

      const j0 = i << 2
      const j1 = j0 + 1
      const j2 = j1 + 1
      const j3 = j2 + 1

      const k0 = i * 3 | 0
      const k1 = k0 + 1
      const k2 = k1 + 1

      // chunk bounds
      const chunk = (offset + i) >>> CHUNK_SIZE_LOG2
      if (chunk !== last_chunk) {
        last_chunk = chunk
        const ic = chunk * chunk_len
        min_x  = chunk_get(ic, "min_x", 0)
        min_y  = chunk_get(ic, "min_y", 0)
        min_z  = chunk_get(ic, "min_z", 0)
        max_x  = chunk_get(ic, "max_x", 0)
        max_y  = chunk_get(ic, "max_y", 0)
        max_z  = chunk_get(ic, "max_z", 0)
        min_sx = chunk_get(ic, "min_scale_x", 0)
        min_sy = chunk_get(ic, "min_scale_y", 0)
        min_sz = chunk_get(ic, "min_scale_z", 0)
        max_sx = chunk_get(ic, "max_scale_x", 0)
        max_sy = chunk_get(ic, "max_scale_y", 0)
        max_sz = chunk_get(ic, "max_scale_z", 0)
        min_r  = chunk_get(ic, "min_r", 0)
        min_g  = chunk_get(ic, "min_g", 0)
        min_b  = chunk_get(ic, "min_b", 0)
        max_r  = chunk_get(ic, "max_r", 1)
        max_g  = chunk_get(ic, "max_g", 1)
        max_b  = chunk_get(ic, "max_b", 1)
      }

      const packed_position = data[iv]
      const packed_rotation = data[iv + 1]
      const packed_scale    = data[iv + 2]
      const packed_color    = data[iv + 3]

      // position, 11-10-11 bits
      position[k0] = lerp(min_x, max_x, ((packed_position >>> 21) & 2047) / 2047)
      position[k1] = lerp(min_y, max_y, ((packed_position >>> 11) & 1023) / 1023)
      position[k2] = lerp(min_z, max_z, (packed_position & 2047) / 2047)

      // color, 8-8-8-8 bits. rgb are already `f_dc * SH_C0 + 0.5`, alpha is already sigmoid(opacity)
      color[j0] = lerp(min_r, max_r, ((packed_color >>> 24) & 255) / 255)
      color[j1] = lerp(min_g, max_g, ((packed_color >>> 16) & 255) / 255)
      color[j2] = lerp(min_b, max_b, ((packed_color >>> 8) & 255) / 255)
      color[j3] = (packed_color & 255) / 255

      // scale, 11-10-11 bits in log space
      scale[k0] = Math.exp(lerp(min_sx, max_sx, ((packed_scale >>> 21) & 2047) / 2047))
      scale[k1] = Math.exp(lerp(min_sy, max_sy, ((packed_scale >>> 11) & 1023) / 1023))
      scale[k2] = Math.exp(lerp(min_sz, max_sz, (packed_scale & 2047) / 2047))

      // rotation, 2-10-10-10 bits: largest component index + 3 smallest components
      unpack_rot(packed_rotation)
      let rx = quat[1]
      let ry = quat[2]
      let rz = quat[3]
      let rw = quat[0]
      if (rw < 0) {
        rx *= -1; ry *= -1; rz *= -1; rw *= -1
      }
      rotation[j0] = rx
      rotation[j1] = ry
      rotation[j2] = rz
      rotation[j3] = rw
    }

    output.count = count
    output.offset = offset
    output.position = position
    output.rotation = rotation
    output.scale = scale
    output.color = color
    transfer[0] = position.buffer
    transfer[1] = rotation.buffer
    transfer[2] = scale.buffer
    transfer[3] = color.buffer
    postMessage(output, transfer)
  }
}
