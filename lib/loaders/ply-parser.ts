import { Ply_Element, Ply_Property } from "./ply-loader"

declare const postMessage: Worker["postMessage"]


export type Ply_Parser_Output = {
  count:    number
  offset:   number
  position: Float32Array
  rotation: Float32Array
  scale:    Float32Array
  color:    Float32Array
}

export type Ply_Parser_Input_Header = Ply_Element & {
  type: "header"
}

export type Ply_Parser_Input_Data = {
  type:   "data"
  data:   Float32Array
  count:  number
  offset: number
}


export function parser_worker() {

  const SH_C0 = 0.28209479177387814

  let vertex_len = 0

  const vertex_prop_offset: Record<Ply_Property["name"], number> = {
    x:       0,
    y:       0,
    z:       0,
    f_dc_0:  0,
    f_dc_1:  0,
    f_dc_2:  0,
    opacity: 0,
    scale_0: 0,
    scale_1: 0,
    scale_2: 0,
    rot_0:   0,
    rot_1:   0,
    rot_2:   0,
    rot_3:   0,
  }

  const message_is_header = (data: any): data is Ply_Parser_Input_Header => {
    return data?.type === "header"
  }

  const message_is_data = (data: any): data is Ply_Parser_Input_Data => {
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


  onmessage = (e: MessageEvent<Ply_Parser_Input_Header | Ply_Parser_Input_Data>) => {
    if (message_is_header(e.data)) {
      const props = e.data.props
      for (const name in vertex_prop_offset) {
        vertex_prop_offset[name] = props.findIndex(p => p.name === name)
      }
      vertex_len = props.length
      return
    }

    if (message_is_data(e.data)) {
      parse_data(e.data)
    }
  }

  const parse_data = (msg: Ply_Parser_Input_Data) => {
    const data = msg.data
    const count = msg.count
    const offset = msg.offset

    const position = new Float32Array(count * 4)
    const rotation = new Float32Array(count * 4)
    const scale    = new Float32Array(count * 4)
    const color    = new Float32Array(count * 4)

    for (let i = 0; i < count; i++) {
      const iv = i * vertex_len | 0
      const j0 = i * 4
      const j1 = j0 + 1
      const j2 = j1 + 1
      const j3 = j2 + 1

      // position
      position[j0] = data[iv + vertex_prop_offset.x]
      position[j1] = data[iv + vertex_prop_offset.y]
      position[j2] = data[iv + vertex_prop_offset.z]

      // color
      color[j0] = data[iv + vertex_prop_offset.f_dc_0] * SH_C0 + 0.5
      color[j1] = data[iv + vertex_prop_offset.f_dc_1] * SH_C0 + 0.5
      color[j2] = data[iv + vertex_prop_offset.f_dc_2] * SH_C0 + 0.5
      color[j3] = 1 / (1 + Math.exp(-data[iv + vertex_prop_offset.opacity]))

      //scale
      scale[j0] = Math.exp(data[iv + vertex_prop_offset.scale_0])
      scale[j1] = Math.exp(data[iv + vertex_prop_offset.scale_1])
      scale[j2] = Math.exp(data[iv + vertex_prop_offset.scale_2])

      // rotation
      let rx = data[iv + vertex_prop_offset.rot_1]
      let ry = data[iv + vertex_prop_offset.rot_2]
      let rz = data[iv + vertex_prop_offset.rot_3]
      let rw = data[iv + vertex_prop_offset.rot_0]
      let len = rx * rx + ry * ry + rz * rz + rw * rw
      if (len === 0) {
        rx = ry = rz = 0
        rw = 1
      } else {
        len = 1 / Math.sqrt(len)
        rx *= len; ry *= len; rz *= len; rw *= len
      }
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
