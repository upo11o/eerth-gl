import { acos, atan2, clamp, cos, IOTA, sin, sqrt } from "./math"
import { new_vec3, vec3_set } from "./vec"


export const new_spherical = (polar = IOTA, azimut = 0, radius = 1): Float32Array => {
  const vec = new_vec3()
  vec3_set(vec, polar, azimut, radius)
  return vec
}

export const spherical_get_pos = (spherical: NumberArray, pos: NumberArray): void => {
  const polar  = spherical[0]
  const azimut = spherical[1]
  const radius = spherical[2]
  const polar_sin = sin(polar)
  pos[0] = polar_sin * sin(azimut) * radius
  pos[1] = cos(polar) * radius
  pos[2] = polar_sin * cos(azimut) * radius
}

export const spherical_set_from_pos = (spherical: NumberArray, pos: NumberArray): void => {
  const x = pos[0], y = pos[1], z = pos[2]
  let radius = x * x + y * y + z * z
  if (radius === 0) {
    spherical[0] = spherical[1] = spherical[2] = 0
  }
  else {
    spherical[2] = radius = sqrt(radius)
    spherical[1] = atan2(x, z)
    spherical[0] = acos(clamp(y / radius, -1, 1))
  }
}
