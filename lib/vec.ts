import { clamp, cos, min, sin, sqrt } from "./math"


const id_vec2 = new Float32Array([ 0, 0 ])
/** allocates new Float32Array */
export const new_vec2 = (from: NumberArray = id_vec2): Float32Array => new Float32Array(from)
/** creates Float32Array view */
export const new_vec2_from_buffer = (buf: ArrayBuffer, byte_offset: number): Float32Array => (
  new Float32Array(buf, byte_offset, 8)
)

const id_vec3 = new Float32Array([ 0, 0, 0 ])
/** allocates new Float32Array */
export const new_vec3 = (from: NumberArray = id_vec3): Float32Array => new Float32Array(from)
/** creates Float32Array view */
export const new_vec3_from_buffer = (buf: ArrayBuffer, byte_offset: number): Float32Array => (
  new Float32Array(buf, byte_offset, 12)
)

const id_vec4 = new Float32Array([ 0, 0, 0, 0 ])
/** allocates new Float32Array */
export const new_vec4 = (from: NumberArray = id_vec4): Float32Array => new Float32Array(from)
/** creates Float32Array view */
export const new_vec4_from_buffer = (buf: ArrayBuffer, byte_offset: number): Float32Array => (
  new Float32Array(buf, byte_offset, 16)
)


export const vec2_set = (v: NumberArray, x: number, y: number): void => {
  v[0] = x; v[1] = y
}
export const vec3_set = (v: NumberArray, x: number, y: number, z: number): void => {
  v[0] = x; v[1] = y; v[2] = z
}
export const vec4_set = (v: NumberArray, x: number, y: number, z: number, w: number): void => {
  v[0] = x; v[1] = y; v[2] = z; v[3] = w
}


export const vec2_copy = (v: NumberArray, t: NumberArray): void => {
  t[0] = v[0]; t[1] = v[1]
}
export const vec3_copy = (v: NumberArray, t: NumberArray): void => {
  t[0] = v[0]; t[1] = v[1]; t[2] = v[2]
}
export const vec4_copy = (v: NumberArray, t: NumberArray): void => {
  t[0] = v[0]; t[1] = v[1]; t[2] = v[2]; t[3] = v[3]
}


export const vec2_add = (a: NumberArray, b: NumberArray, t = a): void => {
  t[0] = a[0] + b[0]; t[1] = a[1] + b[1]
}
export const vec3_add = (a: NumberArray, b: NumberArray, t = a): void => {
  t[0] = a[0] + b[0]; t[1] = a[1] + b[1]; t[2] = a[2] + b[2]
}
export const vec4_add = (a: NumberArray, b: NumberArray, t = a): void => {
  t[0] = a[0] + b[0]; t[1] = a[1] + b[1]; t[2] = a[2] + b[2]; t[3] = a[3] + b[3]
}

/** a - b */
export const vec2_sub = (a: NumberArray, b: NumberArray, t = a): void => {
  t[0] = a[0] - b[0]; t[1] = a[1] - b[1]
}
/** a - b */
export const vec3_sub = (a: NumberArray, b: NumberArray, t = a): void => {
  t[0] = a[0] - b[0]; t[1] = a[1] - b[1]; t[2] = a[2] - b[2]
}
/** a - b */
export const vec4_sub = (a: NumberArray, b: NumberArray, t = a): void => {
  t[0] = a[0] - b[0]; t[1] = a[1] - b[1]; t[2] = a[2] - b[2]; t[3] = a[3] - b[3]
}

export const vec2_mult_scalar = (v: NumberArray, scalar: number, t = v): void => {
  t[0] = v[0] * scalar; t[1] = v[1] * scalar
}
export const vec3_mult_scalar = (v: NumberArray, scalar: number, t = v): void => {
  t[0] = v[0] * scalar; t[1] = v[1] * scalar; t[2] = v[2] * scalar
}
export const vec4_mult_scalar = (v: NumberArray, scalar: number, t = v): void => {
  t[0] = v[0] * scalar; t[1] = v[1] * scalar; t[2] = v[2] * scalar; t[3] = v[3] * scalar
}

export const vec2_dot = (a: NumberArray, b: NumberArray): number => (
  a[0] * b[0] + a[1] * b[1]
)
export const vec3_dot = (a: NumberArray, b: NumberArray): number => (
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
)
export const vec4_dot = (a: NumberArray, b: NumberArray): number => (
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
)

/** reflects `v` off a surface with unit normal `n` */
export const vec2_reflect = (v: NumberArray, n: NumberArray, t = v): void => {
  const d = 2 * vec2_dot(v, n)
  t[0] = v[0] - d * n[0]
  t[1] = v[1] - d * n[1]
}


export const vec2_length = (v: NumberArray): number => {
  const x = v[0], y = v[1]
  return sqrt(x * x + y * y)
}
export const vec3_length = (v: NumberArray): number => {
  const x = v[0], y = v[1], z = v[2]
  return sqrt(x * x + y * y + z * z)
}
export const vec4_length = (v: NumberArray): number => {
  const x = v[0], y = v[1], z = v[2], w = v[3]
  return sqrt(x * x + y * y + z * z + w * w)
}


export const vec2_distance2 = (a: NumberArray, b: NumberArray): number => {
  const dx = a[0] - b[0], dy = a[1] - b[1]
  return dx * dx + dy * dy
}
export const vec3_distance2 = (a: NumberArray, b: NumberArray): number => {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2]
  return dx * dx + dy * dy + dz * dz
}


export const vec2_distance = (a: NumberArray, b: NumberArray): number => {
  return sqrt(vec2_distance2(a, b))
}
export const vec3_distance = (a: NumberArray, b: NumberArray): number => {
  return sqrt(vec3_distance2(a, b))
}


export const vec2_normalize = (v: NumberArray, t = v): void => {
  const x = v[0], y = v[1]
  let len = x * x + y * y
  len = 1 / sqrt(len || 1)
  t[0] = x * len
  t[1] = y * len
}
export const vec3_normalize = (v: NumberArray, t = v): void => {
  const x = v[0], y = v[1], z = v[2]
  let len = x * x + y * y + z * z
  len = 1 / sqrt(len || 1)
  t[0] = x * len
  t[1] = y * len
  t[2] = z * len
}


export const vec2_mix = (v1: NumberArray, v2: NumberArray, mix: number, t = v1) => {
  mix = clamp(mix, 0, 1)
  t[0] = v1[0] * (1 - mix) + v2[0] * mix
  t[1] = v1[1] * (1 - mix) + v2[1] * mix
}
export const vec3_mix = (v1: NumberArray, v2: NumberArray, mix: number, t = v1) => {
  mix = clamp(mix, 0, 1)
  t[0] = v1[0] * (1 - mix) + v2[0] * mix
  t[1] = v1[1] * (1 - mix) + v2[1] * mix
  t[2] = v1[2] * (1 - mix) + v2[2] * mix
}


export const vec2_limit = (v: NumberArray, max_len: number, t = v): void => {
  const x = v[0], y = v[1]
  let len = sqrt(x * x + y * y)
  len = 1 / (len || 1) * min(len, max_len)
  t[0] = x * len
  t[1] = y * len
}
export const vec3_limit = (v: NumberArray, max_len: number, t = v): void => {
  const x = v[0], y = v[1], z = v[2]
  let len = sqrt(x * x + y * y + z * z)
  len = 1 / (len || 1) * min(len, max_len)
  t[0] = x * len
  t[1] = y * len
  t[2] = z * len
}


export const vec2_clamp_length = (v: NumberArray, min_len: number, max_len: number, t = v): void => {
  const x = v[0], y = v[1]
  let len = sqrt(x * x + y * y)
  len = 1 / (len || 1) * clamp(len, min_len, max_len)
  t[0] = x * len
  t[1] = y * len
}
export const vec3_clamp_length = (v: NumberArray, min_len: number, max_len: number, t = v): void => {
  const x = v[0], y = v[1], z = v[2]
  let len = sqrt(x * x + y * y + z * z)
  len = 1 / (len || 1) * clamp(len, min_len, max_len)
  t[0] = x * len
  t[1] = y * len
  t[2] = z * len
}


export const vec2_clamp_scalar = (v: NumberArray, min_len: number, max_len: number, t = v): void => {
  t[0] = clamp(v[0], min_len, max_len)
  t[1] = clamp(v[1], min_len, max_len)
}
export const vec3_clamp_scalar = (v: NumberArray, min_len: number, max_len: number, t = v): void => {
  t[0] = clamp(v[0], min_len, max_len)
  t[1] = clamp(v[1], min_len, max_len)
  t[2] = clamp(v[2], min_len, max_len)
}


export const vec3_cross = (a: NumberArray, b: NumberArray, t: NumberArray): void => {
  const ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]
  t[0] = ay * bz - az * by
  t[1] = az * bx - ax * bz
  t[2] = ax * by - ay * bx
}

export const vec2_rot = (v: NumberArray, a: number, t = v): void => {
  const c = cos(a), s = sin(a)
  const x = v[0], y = v[1]
  t[0] = c * x - s * y
  t[1] = c * y + s * x
}

export const vec3_rot_y = (v: NumberArray, a: number, t = v): void => {
  const c = cos(a), s = sin(a)
  const x = v[0], z = v[2]
  t[0] = c * x + s * z
  t[1] = v[1]
  t[2] = c * z - s * x
}

/** rotates `v` by angle `a` around unit `axis` */
export const vec3_axis_rot = (v: NumberArray, a: number, axis: NumberArray, t = v): void => {
  const c = cos(a), s = sin(a)
  const x = v[0], y = v[1], z = v[2]
  const kx = axis[0], ky = axis[1], kz = axis[2]
  const d = (kx * x + ky * y + kz * z) * (1 - c)
  t[0] = x * c + (ky * z - kz * y) * s + kx * d
  t[1] = y * c + (kz * x - kx * z) * s + ky * d
  t[2] = z * c + (kx * y - ky * x) * s + kz * d
}

export const vec3_apply_mat3 = (v: NumberArray, m: NumberArray, t = v): void => {
  const x = v[0], y = v[1], z = v[2]
  t[0] = m[0] * x + m[3] * y + m[6] * z
  t[1] = m[1] * x + m[4] * y + m[7] * z
  t[2] = m[2] * x + m[5] * y + m[8] * z
}

export const vec3_apply_mat4 = (v: NumberArray, m: NumberArray, t = v): void => {
  const x = v[0], y = v[1], z = v[2]
  t[0] = m[0] * x + m[4] * y + m[8]  * z
  t[1] = m[1] * x + m[5] * y + m[9]  * z
  t[2] = m[2] * x + m[6] * y + m[10] * z
}

export const vec3_apply_mat3x4t = (v: NumberArray, m: NumberArray, t = v): void => {
  const x = v[0], y = v[1], z = v[2]
  t[0] = m[0] * x + m[1] * y + m[2]  * z + m[3]
  t[1] = m[4] * x + m[5] * y + m[6]  * z + m[7]
  t[2] = m[8] * x + m[9] * y + m[10] * z + m[11]
}
