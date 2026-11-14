import { cos, sin } from "./math"


/*
  mat3x4t_* variants operate on matrices stored as GLSL `mat3x4` —
  the transpose of the standard mat4x3 layout. Storage index `4*row+col`
  replaces the standard `4*col+row`, so every element access below is index-transposed.
  Column X is at indices {0,4,8}, Y at {1,5,9}, Z at {2,6,10}, and translation T at {3,7,11}
  (instead of {0,1,2}, {4,5,6}, {8,9,10}, {12,13,14} in the standard mat4 layout).
  Usage in shader:
    in vec3 aPosition;
    in mat3x4 iModelMatrix;
    void main() {
      gl_Position = vec4(transpose(iModelMatrix) * vec4(aPosition, 1), 1);
    }
*/

const mat3x4t_id = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
])

export const new_mat3x4t = (from: Float32Array = mat3x4t_id): Float32Array => new Float32Array(from)

export const new_mat3x4t_from_buffer = (buf: ArrayBuffer, byte_offset: number): Float32Array => {
  const m = new Float32Array(buf, byte_offset, 12)
  mat3x4t_identify(m)
  return m
}

export const mat3x4t_identify = (m: Float32Array): void => {
  m.fill(0)
  m[0] = m[5] = m[10] = 1
}

export const mat3x4t_copy = (m: Float32Array, target: Float32Array): void => {
  target.set(m)
}

//////// POSITION
///////

export const mat3x4t_set_pos = (m: Float32Array, x: number, y: number, z: number): void => {
  m[3] = x; m[7] = y; m[11] = z
}

/** movement along global XYZ-axises */
export const mat3x4t_movg = (m: Float32Array, x: number, y: number, z: number): void => {
  m[3] += x; m[7] += y; m[11] += z
}

/** movement along global X-axis */
export const mat3x4t_mov_gx = (m: Float32Array, dx: number): void => {
  m[3] += dx
}

/** movement along global Y-axis */
export const mat3x4t_mov_gy = (m: Float32Array, dy: number): void => {
  m[7] += dy
}

/** movement along global Z-axis */
export const mat3x4t_mov_gz = (m: Float32Array, dz: number): void => {
  m[11] += dz
}

/** movement along local XYZ-axises */
export const mat3x4t_movl = (m: Float32Array, x: number, y: number, z: number): void => {
  m[3]  += x * m[0] + y * m[1] + z * m[2]
  m[7]  += x * m[4] + y * m[5] + z * m[6]
  m[11] += x * m[8] + y * m[9] + z * m[10]
}

/** movement along local X-axis */
export const mat3x4t_mov_lx = (m: Float32Array, x: number): void => {
  m[3] += x * m[0]; m[7] += x * m[4]; m[11] += x * m[8]
}

/** movement along local Y-axis */
export const mat3x4t_mov_ly = (m: Float32Array, y: number): void => {
  m[3] += y * m[1]; m[7] += y * m[5]; m[11] += y * m[9]
}

/** movement along local Z-axis */
export const mat3x4t_mov_lz = (m: Float32Array, z: number): void => {
  m[3] += z * m[2]; m[7] += z * m[6]; m[11] += z * m[10]
}

//////// SCALE
///////

/** uniform local scale */
export const mat3x4t_scl = (m: Float32Array, s: number): void => {
  m[0] *= s; m[4] *= s; m[8]  *= s
  m[1] *= s; m[5] *= s; m[9]  *= s
  m[2] *= s; m[6] *= s; m[10] *= s
}

/** scale along local XYZ-axises */
export const mat3x4t_scl_xyz = (m: Float32Array, x: number, y: number, z: number): void => {
  m[0] *= x; m[4] *= x; m[8]  *= x
  m[1] *= y; m[5] *= y; m[9]  *= y
  m[2] *= z; m[6] *= z; m[10] *= z
}

/** scale along local X-axis */
export const mat3x4t_scl_x = (m: Float32Array, s: number): void => {
  m[0] *= s; m[4] *= s; m[8] *= s
}

/** scale along local Y-axis */
export const mat3x4t_scl_y = (m: Float32Array, s: number): void => {
  m[1] *= s; m[5] *= s; m[9] *= s
}

/** scale along local Z-axis */
export const mat3x4t_scl_z = (m: Float32Array, s: number): void => {
  m[2] *= s; m[6] *= s; m[10] *= s
}


//////// ROTATION
///////

/** local rotation around local X-axis */
export const mat3x4t_rot_lx = (m: Float32Array, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m1 = m[1], m5 = m[5], m9 = m[9],
    m2 = m[2], m6 = m[6], m10 = m[10]
  m[1] = c * m1 + s * m2;  m[2]  = c * m2 - s * m1
  m[5] = c * m5 + s * m6;  m[6]  = c * m6 - s * m5
  m[9] = c * m9 + s * m10; m[10] = c * m10 - s * m9
}

/** local rotation around local Y-axis */
export const mat3x4t_rot_ly = (m: Float32Array, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m0 = m[0], m4 = m[4], m8 = m[8],
    m2 = m[2], m6 = m[6], m10 = m[10]
  m[0] = c * m0 - s * m2;  m[2]  = c * m2 + s * m0
  m[4] = c * m4 - s * m6;  m[6]  = c * m6 + s * m4
  m[8] = c * m8 - s * m10; m[10] = c * m10 + s * m8
}

/** local rotation around local Z-axis */
export const mat3x4t_rot_lz = (m: Float32Array, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m0 = m[0], m4 = m[4], m1 = m[1],
    m5 = m[5], m8 = m[8], m9 = m[9]
  m[0] = c * m0 + s * m1; m[1] = c * m1 - s * m0
  m[4] = c * m4 + s * m5; m[5] = c * m5 - s * m4
  m[8] = c * m8 + s * m9; m[9] = c * m9 - s * m8
}

/** local rotation around global X-axis */
export const mat3x4t_rot_gx = (m: Float32Array, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m4 = m[4], m5 = m[5], m6 = m[6],
    m8 = m[8], m9 = m[9], m10 = m[10]
  m[4] = m4 * c - m8 * s;  m[8]  = m8 * c + m4 * s
  m[5] = m5 * c - m9 * s;  m[9]  = m9 * c + m5 * s
  m[6] = m6 * c - m10 * s; m[10] = m10 * c + m6 * s
}

/** local rotation around global Y-axis */
export const mat3x4t_rot_gy = (m: Float32Array, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m0 = m[0], m1 = m[1], m2 = m[2],
    m8 = m[8], m9 = m[9], m10 = m[10]
  m[0] = m0 * c + m8 * s;  m[8]  = m8 * c - m0 * s
  m[1] = m1 * c + m9 * s;  m[9]  = m9 * c - m1 * s
  m[2] = m2 * c + m10 * s; m[10] = m10 * c - m2 * s
}

/** local rotation around global Z-axis */
export const mat3x4t_rot_gz = (m: Float32Array, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m0 = m[0], m4 = m[4], m1 = m[1],
    m5 = m[5], m2 = m[2], m6 = m[6]
  m[0] = m0 * c - m4 * s; m[4] = m4 * c + m0 * s
  m[1] = m1 * c - m5 * s; m[5] = m5 * c + m1 * s
  m[2] = m2 * c - m6 * s; m[6] = m6 * c + m2 * s
}

const mat3x4t_rotg_component = (
  m: Float32Array, i0: number, i1: number, i2: number,
  kx: number, ky: number, kz: number,
  c: number, s: number, t: number,
): void => {
  const x = m[i0], y = m[i1], z = m[i2]
  const dot = kx * x + ky * y + kz * z
  m[i0] = x * c + (ky * z - kz * y) * s + kx * dot * t
  m[i1] = y * c + (kz * x - kx * z) * s + ky * dot * t
  m[i2] = z * c + (kx * y - ky * x) * s + kz * dot * t
}

/** local rotation around an arbitrary global axis (must be a unit vector) */
export const mat3x4t_rot_gaxis = (m: Float32Array, axis: Float32Array, a: number): void => {
  const kx = axis[0], ky = axis[1], kz = axis[2]
  const c = cos(a), s = sin(a), t = 1 - c
  mat3x4t_rotg_component(m, 0, 4,  8, kx, ky, kz, c, s, t)
  mat3x4t_rotg_component(m, 1, 5,  9, kx, ky, kz, c, s, t)
  mat3x4t_rotg_component(m, 2, 6, 10, kx, ky, kz, c, s, t)
}


//////// MULTIPLY
///////

/** T = A • B */
export const mat3x4t_mult = (a: Float32Array, b: Float32Array, t = a): void => {
  const a00 = a[0], a01 = a[1], a02 = a[2],  a03 = a[3]
  const a10 = a[4], a11 = a[5], a12 = a[6],  a13 = a[7]
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11]

  const b00 = b[0], b01 = b[1], b02 = b[2],  b03 = b[3]
  const b10 = b[4], b11 = b[5], b12 = b[6],  b13 = b[7]
  const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11]

  t[0]  = a00 * b00 + a01 * b10 + a02 * b20
  t[1]  = a00 * b01 + a01 * b11 + a02 * b21
  t[2]  = a00 * b02 + a01 * b12 + a02 * b22
  t[3]  = a00 * b03 + a01 * b13 + a02 * b23 + a03

  t[4]  = a10 * b00 + a11 * b10 + a12 * b20
  t[5]  = a10 * b01 + a11 * b11 + a12 * b21
  t[6]  = a10 * b02 + a11 * b12 + a12 * b22
  t[7]  = a10 * b03 + a11 * b13 + a12 * b23 + a13

  t[8]  = a20 * b00 + a21 * b10 + a22 * b20
  t[9]  = a20 * b01 + a21 * b11 + a22 * b21
  t[10] = a20 * b02 + a21 * b12 + a22 * b22
  t[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23
}
