import { acos, cos, min, sin, sqrt } from "./math"
import { noop } from "./noop"
import { vec4_dot } from "./vec"


const id_quat = new Float32Array([ 0, 0, 0, 1 ])

export const new_quat = (from: NumberArray = id_quat): Float32Array => new Float32Array(from)

export const quat_identify = (q: NumberArray): void => {
  q[0] = q[1] = q[2] = 0; q[3] = 1
}

export const quat_set = (q: NumberArray, x: number, y: number, z: number, w: number): void => {
  q[0] = x; q[1] = y; q[2] = z; q[3] = w
}

export const quat_copy = (q: NumberArray, from: NumberArray): void => {
  q[0] = from[0]; q[1] = from[1]; q[2] = from[2]; q[3] = from[3]
}


export const quat_normalize = (q: NumberArray): void => {
  let x = q[0], y = q[1], z = q[2], w = q[3]
  let len = x * x + y * y + z * z + w * w
  if (len === 0) {
    quat_identify(q)
  } else {
    len = 1 / sqrt(len)
    q[0] = x * len
    q[1] = y * len
    q[2] = z * len
    q[3] = w * len
  }
}


export const quat_set_from_euler_xyz = (q: NumberArray, x: number, y: number, z: number): void => {
  x *= 0.5
  y *= 0.5
  z *= 0.5

  const cx = cos(x)
  const cy = cos(y)
  const cz = cos(z)
  const sx = sin(x)
  const sy = sin(y)
  const sz = sin(z)

  q[0] = sx * cy * cz + cx * sy * sz
  q[1] = cx * sy * cz - sx * cy * sz
  q[2] = cx * cy * sz + sx * sy * cz
  q[3] = cx * cy * cz - sx * sy * sz
}


export const quat_set_from_euler_x = (q: NumberArray, x: number): void => {
  x *= 0.5
  const cx = cos(x)
  const sx = sin(x)
  q[0] = sx
  q[1] = 0
  q[2] = 0
  q[3] = cx
}


export const quat_set_from_euler_y = (q: NumberArray, y: number): void => {
  y *= 0.5
  const cy = cos(y)
  const sy = sin(y)
  q[0] = 0
  q[1] = sy
  q[2] = 0
  q[3] = cy
}


export const quat_set_from_euler_z = (q: NumberArray, z: number): void => {
  z *= 0.5
  const cz = cos(z)
  const sz = sin(z)
  q[0] = 0
  q[1] = 0
  q[2] = sz
  q[3] = cz
}


export const quat_slerp = (q0: NumberArray, q1: NumberArray, t: number, out = q0): void => {
  const x0 = q0[0], y0 = q0[1], z0 = q0[2], w0 = q0[3]
  let   x1 = q1[0], y1 = q1[1], z1 = q1[2], w1 = q1[3]

  let dot = min(1, vec4_dot(q0, q1))
  if (dot === 1) {
    if (out !== q0) quat_copy(out, q0)
    return
  }

  if (dot < 0) {
    x1 = -x1
    y1 = -y1
    z1 = -z1
    w1 = -w1
    dot = -dot
  }

  let s = 1 - t

  if (dot < 0.9995) {
    // slerp
    const theta = acos(dot)
    const theta_sin = sin(theta)
    s = sin(s * theta) / theta_sin
    t = sin(t * theta) / theta_sin
    out[0] = x0 * s + x1 * t
    out[1] = y0 * s + y1 * t
    out[2] = z0 * s + z1 * t
    out[3] = w0 * s + w1 * t
  }
  else {
    // for small angles, lerp then normalize
    out[0] = x0 * s + x1 * t
    out[1] = y0 * s + y1 * t
    out[2] = z0 * s + z1 * t
    out[3] = w0 * s + w1 * t
    quat_normalize(out)
  }
}


export const new_quat_slerping = (q0: NumberArray, q1: NumberArray): (q: NumberArray, t: number) => void => {
  const x0 = q0[0], y0 = q0[1], z0 = q0[2], w0 = q0[3]
  let   x1 = q1[0], y1 = q1[1], z1 = q1[2], w1 = q1[3]

  let dot = min(1, vec4_dot(q0, q1))
  if (dot === 1) {
    return noop
  }

  if (dot < 0) {
    x1 = -x1
    y1 = -y1
    z1 = -z1
    w1 = -w1
    dot = -dot
  }

  if (dot < 0.9995) {
    // slerp
    const theta = acos(dot)
    const theta_sin = sin(theta)
    return (q, t) => {
      let s = 1 - t
      s = sin(s * theta) / theta_sin
      t = sin(t * theta) / theta_sin
      q[0] = x0 * s + x1 * t
      q[1] = y0 * s + y1 * t
      q[2] = z0 * s + z1 * t
      q[3] = w0 * s + w1 * t
    }
  }
  else {
    // for small angles, lerp then normalize
    return (q, t) => {
      const s = 1 - t
      q[0] = x0 * s + x1 * t
      q[1] = y0 * s + y1 * t
      q[2] = z0 * s + z1 * t
      q[3] = w0 * s + w1 * t
      quat_normalize(q)
    }
  }
}
