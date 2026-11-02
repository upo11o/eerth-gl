export const random = Math.random
export const min    = Math.min
export const max    = Math.max
export const abs    = Math.abs
export const sign   = Math.sign
export const trunc  = Math.trunc
export const floor  = Math.floor
export const ceil   = Math.ceil
export const round  = Math.round
export const sqrt   = Math.sqrt
export const cbrt   = Math.cbrt
export const pow    = Math.pow
export const exp    = Math.exp
export const log    = Math.log
export const log2   = Math.log2
export const log10  = Math.log10
export const sin    = Math.sin
export const cos    = Math.cos
export const tan    = Math.tan
export const asin   = Math.asin
export const acos   = Math.acos
export const atan2  = Math.atan2
export const hypot  = Math.hypot

export const SQRT2 = Math.SQRT2
export const SQRT3 = sqrt(3)
export const SQRT1_2 = Math.SQRT1_2
export const SQRT1_3 = 1 / SQRT3
export const PI = Math.PI
export const TAU = PI * 2
export const IOTA = PI / 2
export const DEG2RAD = PI / 180
export const RAD2DEG = 180 / PI

export const clamp = (value: number, min_value: number, max_value: number) => max(min_value, min(max_value, value))

export const fract = (value: number) => value - (value | 0)

export const map_scalar = (
  value:    number,
  from_min: number,
  from_max: number,
  to_min:   number,
  to_max:   number,
) => {
  return to_min + (value - from_min) / (from_max - from_min) * (to_max - to_min)
}

/** `from` inclusive, `to` exclusive */
export const rnd = (from: number, to: number) => from + (to - from) * random()
/** `from` and `to` are inclusive */
export const rnd_int = (from: number, to: number) => floor(from + (to - from + 1) * random())

export const dot2 = (x0: number, y0: number, x1: number, y1: number) => x0 * x1 + y0 * y1
export const dot3 = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => x0 * x1 + y0 * y1 + z0 * z1

export const distance2 = (x0: number, y0: number, x1: number, y1: number) => {
  const dx = x1 - x0
  const dy = y1 - y0
  return sqrt(dx * dx + dy * dy)
}
export const distance3 = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) => {
  const dx = x1 - x0
  const dy = y1 - y0
  const dz = z1 - z0
  return sqrt(dx * dx + dy * dy + dz * dz)
}

export const floor_to_odd = (n: number) => floor(n) - 1 | 1
export const ceil_to_odd  = (n: number) => ceil(n) | 1
export const mod = (n: number, m: number) => ((n % m) + m) % m
export const mod_range = (n: number, min_value: number, max_value: number) => min_value + mod(n - min_value, max_value - min_value)

export const smooth_1 = (t: number) => t * t * (3 - 2 * t)
export const smooth_2 = (t: number) => t * t * t * (t * (6 * t - 15) + 10)
export const smooth_3 = (t: number) => t * t * t * t * (35 - t * (84 - t * (70 - t * 20)))

export const ease_quadratic_bezier = (t: number, control: number) => {
  return 2 * t * (1 - t) * control + t * t
}
export const ease_cubic_bezier = (t: number, control: number) => {
  return 3 * t * (1 - t) * control + t * t * t
}


const factorial_cache = [ 1, 1 ]

export const factorial = (n: number): number => {
  const cache_len = factorial_cache.length
  if (cache_len > n) return factorial_cache[n]

  let result = factorial_cache[cache_len - 1]
  for (let i = cache_len; i <= n; i++) {
    factorial_cache[i] = result *= i
  }
  return result
}


export const calc_texture_size = (count: number): { width: number, height: number } => {
  const width = ceil(sqrt(count))
  const height = ceil(count / width)
  return { width, height }
}


/** cosine distributed sample inside hemiball
 * @param {number} u1 random float [0..1], defines polar angle
 * @param {number} u2 random float [0..1], defines azimuthal angle
 * @param {number} u3 random float [0..1], defines radius, (pass 1 if need hemisphere samples)
 */
export const cosine_sample_hemiball_z = (u1: number, u2: number, u3: number, out: NumberArray) => {
  const r2  = sqrt(u1)
  const phi = TAU * u2
  const r3  = cbrt(u3)
  out[0] = r3 * r2 * cos(phi)
  out[1] = r3 * r2 * sin(phi)
  out[2] = r3 * sqrt(1 - u1)
}

/**
 * Remaps a uniformly-distributed hemisphere point to cosine-weighted.
 * Assumes z >= 0 is the polar axis. Works for both surface (|x,y,z|=1) and
 * interior points (preserves radial distance).
 */
export const to_cosine_distributed = (x: number, y: number, z: number, out: NumberArray) => {
  let r = x * x + y * y + z * z
  if (r === 0) return { x: 0, y: 0, z: 0 }

  // Normalize to unit direction
  r = sqrt(r)
  x = x / r, y = y / r, z = z / r

  // new_cos = sqrt(old_cos); xy scale derived from unit-sphere constraint
  const new_cos = sqrt(z)
  const s = 1.0 / sqrt(1.0 + z) // = sqrt(1 - new_cos²) / sqrt(1 - nz²)

  out[0] = x * s * r
  out[1] = y * s * r
  out[2] = new_cos * r
}
