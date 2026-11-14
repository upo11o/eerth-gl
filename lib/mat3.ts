import { cos, sin } from "./math"


const id_mat3 = new Float32Array([
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
])

export const new_mat3 = (from = id_mat3): Float32Array<ArrayBuffer> => new Float32Array(from)

export const new_mat3_from_buffer = (buf: ArrayBuffer, byte_offset: number): Float32Array<ArrayBuffer> => new Float32Array(buf, byte_offset, 9)

export const mat3_identify = (m: Float32Array): void => {
  m.fill(0)
  m[0] = m[4] = m[8] = 1
}


export const mat3_from_axis_angle = (
  m: Float32Array,
  ax: number, ay: number, az: number,
  angle: number,
): void => {
  const c = cos(angle), s = sin(angle), t = 1 - c
  m[0] = t * ax * ax + c;      m[3] = t * ax * ay - s * az; m[6] = t * ax * az + s * ay
  m[1] = t * ax * ay + s * az; m[4] = t * ay * ay + c;      m[7] = t * ay * az - s * ax
  m[2] = t * ax * az - s * ay; m[5] = t * ay * az + s * ax; m[8] = t * az * az + c
}
