import { cos, IOTA, max, PI, sin, TAU } from "./math"


export const cube_lines = new Float32Array([
  -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, -1, -1, 1, 1,
  -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, -1, 1, 1, -1, -1, 1,
])


export const get_sphere_lines = (
  width_segments: number,
  height_segments: number,
  radius: number,
): Float32Array => {
  width_segments = max(3, width_segments)
  height_segments = max(2, height_segments)

  const buf: number[] = []

  const ha = PI / height_segments
  const wa = TAU / width_segments

  const phi_mid = height_segments % 2
  const phi_end = (height_segments / 2 | 0) + phi_mid
  const is_mid = phi_end - phi_mid

  for (let phi = 0; phi < phi_end; phi++) {
    const pa0 = ha * phi
    const pa1 = ha * (phi + 1)

    const y0 = cos(pa0) * radius
    const y1 = cos(pa1) * radius

    const sinp0 = sin(pa0)
    const sinp1 = sin(pa1)

    for (let theta = 0; theta < width_segments; theta++) {
      const ta0 = wa * theta - IOTA
      const ta1 = wa * (theta + 1) - IOTA

      const x0 = cos(ta0) * radius
      const x1 = cos(ta1) * radius
      const z0 = sin(ta0) * radius
      const z1 = sin(ta1) * radius

      const x01 = sinp0 * x1
      const x10 = sinp1 * x0
      const x11 = sinp1 * x1

      const z01 = sinp0 * z1
      const z10 = sinp1 * z0
      const z11 = sinp1 * z1

      if (phi === 0) buf.push(
        0,  y0, 0,  x11,  y1, z11,  x11,  y1, z11,  x10,  y1, z10,
        0, -y0, 0,  x10, -y1, z10,  x10, -y1, z10,  x11, -y1, z11,
      )

      else if (phi === is_mid) buf.push(
        x11, y1, z11,  x01, y0, z01,
      )

      else buf.push(
        x11,  y1, z11,  x01,  y0, z01,  x10,  y1, z10,  x11,  y1, z11,
        x11, -y1, z11,  x01, -y0, z01,  x10, -y1, z10,  x11, -y1, z11,
      )
    }
  }

  return new Float32Array(buf)
}
