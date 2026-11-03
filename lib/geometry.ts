import { cos, IOTA, max, PI, sin, TAU } from "./math"
import { new_vec3, vec3_clone, vec3_cross, vec3_lerp, vec3_mult_scalar, vec3_normalize, vec3_set, vec3_sub } from "./vec"


const dummy3 = new_vec3()
const a = new_vec3()
const b = new_vec3()
const c = new_vec3()


export const cube_lines = new Float32Array([
  -1, -1, -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, 1, 1, -1, -1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1, -1, -1, 1, 1,
  -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, -1, 1, 1, -1, -1, 1,
])


export const get_ring_2d_lines = (
  radius: number,
  segments: number,
) => {
  segments = max(3, segments)
  const ia = TAU / segments
  const buf: number[] = []
  let px = radius, py = 0

  for (let i = 1; i <= segments; i++) {
    const a = i * ia
    const x = cos(a) * radius
    const y = sin(a) * radius
    buf.push(px, py, x, y)
    px = x
    py = y
  }

  return new Float32Array(buf)
}


export const get_tube_x = (
  radius = 0.5,
  length = 1,
  radial_segments = 16,
  length_segments = 1,
) => {
  const hl = length / 2
  const li = length / length_segments

  const ai = TAU / radial_segments
  let pz = radius, py = 0

  const pos: number[] = []

  for (let i = 1; i <= radial_segments; i++) {
    const a = i * ai,
      z = cos(a) * radius,
      y = sin(a) * radius

    for (let ix = 0; ix < length_segments; ix++) {
      const x  = -hl + ix * li
      const nx = -hl + (ix + 1) * li
      pos.push(
        nx, y,  z,   x,  y,  z,   x,  py, pz,
        x,  py, pz,  nx, py, pz,  nx, y,  z,
      )
    }

    pz = z
    py = y
  }

  return new Float32Array(pos)
}


export const get_tube_y = (
  radius = 0.5,
  length = 1,
  radial_segments = 16,
  length_segments = 1,
) => {
  const hl = length / 2
  const li = length / length_segments

  const ai = TAU / radial_segments
  let px = radius, pz = 0

  const pos: number[] = []

  for (let i = 1; i <= radial_segments; i++) {
    const a = i * ai,
      x = cos(a) * radius,
      z = sin(a) * radius

    for (let iy = 0; iy < length_segments; iy++) {
      const y  = -hl + iy * li
      const ny = -hl + (iy + 1) * li
      pos.push(
        px, y, pz,  x, y, z,     x, ny, z,
        x, ny, z,   px, ny, pz,  px, y, pz,
      )
    }

    px = x
    pz = z
  }

  return new Float32Array(pos)
}


export const get_cone_y_lines = (
  radius: number,
  height: number,
  radial_segments: number,
  azimut_offset = 0,
) => {
  radial_segments = max(3, radial_segments)
  const ia = TAU / radial_segments
  const buf: number[] = []
  let pa = azimut_offset, px = cos(pa) * radius, pz = sin(pa) * radius

  for (let i = 1; i <= radial_segments; i++) {
    pa += ia
    const x = cos(pa) * radius
    const z = sin(pa) * radius
    buf.push(px, 0, pz, x, 0, z, px, 0, pz, 0, height, 0)
    px = x
    pz = z
  }

  return new Float32Array(buf)
}


export const get_cone_y = (
  radius: number,
  height: number,
  radial_segments: number,
  azimut_offset = 0,
) => {
  radial_segments = max(3, radial_segments)
  const ia = TAU / radial_segments
  const buf: number[] = []
  let pa = azimut_offset, px = cos(pa) * radius, pz = sin(pa) * radius

  for (let i = 1; i <= radial_segments; i++) {
    pa += ia
    const x = cos(pa) * radius
    const z = sin(pa) * radius
    buf.push(
      x, 0, z, 0, height, 0, px, 0, pz,
      px, 0, pz, 0, 0, 0, x, 0, z,
    )
    px = x
    pz = z
  }

  return new Float32Array(buf)
}


export const get_sphere_lines = (
  radius: number,
  radial_segments: number,
  height_segments: number,
): Float32Array => {
  radial_segments = max(3, radial_segments)
  height_segments = max(2, height_segments)

  const buf: number[] = []

  const ha = PI / height_segments
  const wa = TAU / radial_segments

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

    for (let theta = 0; theta < radial_segments; theta++) {
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


export const get_icosahedron = (radius = 1, detail = 0) => {
  const t = (1 + Math.sqrt(5)) / 2

  const positions = new Float32Array([
    -1, t, 0, 	1, t, 0, 	-1, -t, 0, 	1, -t, 0,
    0, -1, t, 	0, 1, t,	0, -1, -t, 	0, 1, -t,
    t, 0, -1, 	t, 0, 1, 	-t, 0, -1, 	-t, 0, 1,
  ])

  const indices = new Uint16Array([
    0, 11, 5,   0,  5,  1,   0,  1,  7,   0, 7, 10,   0, 10, 11,
    1,  5, 9,   5, 11,  4,  11, 10,  2,  10, 7,  6,   7,  1,  8,
    3,  9, 4,   3,  4,  2,   3,  2,  6,   3, 6,  8,   3,  8,  9,
    4,  9, 5,   2,  4, 11,   6,  2, 10,   8, 6,  7,   9,  8,  1,
  ])

  const buffer = subdivide(positions, indices, detail)

  for (let i = 0; i < buffer.length; i += 3) {
    vec3_set(dummy3, buffer[i], buffer[i + 1], buffer[i + 2])
    vec3_normalize(dummy3)
    vec3_mult_scalar(dummy3, radius)
    buffer[i + 0] = dummy3[0]
    buffer[i + 1] = dummy3[1]
    buffer[i + 2] = dummy3[2]
  }

  return buffer
}

const subdivide = (vertices: NumberArray, indices: NumberArray, detail: number): Float32Array => {
  const buffer: number[] = []

  // iterate over all faces and apply a subdivision with the given detail value
  for (let i = 0; i < indices.length; i += 3) {
    // get the vertices of the face
    set_vertex_by_id(vertices, indices[i + 0], a)
    set_vertex_by_id(vertices, indices[i + 1], b)
    set_vertex_by_id(vertices, indices[i + 2], c)
    // perform subdivision
    subdivide_face(buffer, a, b, c, detail)
  }

  return new Float32Array(buffer)
}

const set_vertex_by_id = (vertices: NumberArray, id: number, target: NumberArray): void => {
  const stride = id * 3 | 0
  target[0] = vertices[stride + 0]
  target[1] = vertices[stride + 1]
  target[2] = vertices[stride + 2]
}

const subdivide_face = (buffer: number[], a: NumberArray, b: NumberArray, c: NumberArray, detail: number): void => {
  const cols = detail + 1

  // we use this multidimensional array as a data structure for creating the subdivision
  const v: Float32Array[][] = []

  // construct all of the vertices for this subdivision
  for (let i = 0; i <= cols; i++) {
    v[i] = []

    const aj = vec3_clone(a)
    vec3_lerp(aj, c, i / cols)
    const bj = vec3_clone(b)
    vec3_lerp(bj, c, i / cols)

    const rows = cols - i

    for (let j = 0; j <= rows; j++) {
      if (j === 0 && i === cols) {
        v[i][j] = aj
      } else {
        const cj = vec3_clone(aj)
        vec3_lerp(cj, bj, j / rows)
        v[i][j] = cj
      }
    }
  }

  // construct all of the faces
  for ( let i = 0; i < cols; i++ ) {
    for ( let j = 0; j < 2 * ( cols - i ) - 1; j++ ) {
      const k = j / 2 | 0

      if (j % 2 === 0) {
        push_vertex(v[i][k + 1], buffer)
        push_vertex(v[i + 1][k], buffer)
        push_vertex(v[i][k], buffer)
      } else {
        push_vertex(v[i][k + 1], buffer)
        push_vertex(v[i + 1][k + 1], buffer)
        push_vertex(v[i + 1][k], buffer)
      }
    }
  }
}

const push_vertex = (vertex: NumberArray, buffer: number[]): void => {
  buffer.push(vertex[0], vertex[1], vertex[2])
}


export const tris_to_lines = <T extends number[] | TypedArray>(
  buf: T,
  vlen: number,
): T => {
  const lines: number[] = []
  const vlen2 = vlen << 1
  const vlen3 = vlen * 3 | 0
  for (let i = 0; i < buf.length; i += vlen3) {
    const i2 = i + vlen, i3 = i + vlen2
    const ax = buf[i],  ay = buf[i  + 1], az = buf[i  + 2]
    const bx = buf[i2], by = buf[i2 + 1], bz = buf[i2 + 2]
    const cx = buf[i3], cy = buf[i3 + 1], cz = buf[i3 + 2]
    lines.push(
      ax, ay, az, bx, by, bz,
      bx, by, bz, cx, cy, cz,
      cx, cy, cz, ax, ay, az,
    )
  }
  return buf instanceof Array
    ? lines as T
    : new (buf.constructor as { new (arr: number[]): T })(lines)
}


export const compute_normals = (position: Float32Array) => {
  const normals = new Float32Array(position.length)

  const pA = new_vec3(), pB = new_vec3(), pC = new_vec3()
  const cb = new_vec3(), ab = new_vec3()

  for (let i = 0; i < position.length; i += 9) {
    vec3_set(pA, position[i + 0], position[i + 1], position[i + 2])
    vec3_set(pB, position[i + 3], position[i + 4], position[i + 5])
    vec3_set(pC, position[i + 6], position[i + 7], position[i + 8])

    vec3_sub(pC, pB, cb)
    vec3_sub(pA, pB, ab)
    vec3_cross(cb, ab)
    vec3_normalize(cb)

    normals[i + 0] = normals[i + 3] = normals[i + 6] = cb[0]
    normals[i + 1] = normals[i + 4] = normals[i + 7] = cb[1]
    normals[i + 2] = normals[i + 5] = normals[i + 8] = cb[2]
  }

  return normals
}
