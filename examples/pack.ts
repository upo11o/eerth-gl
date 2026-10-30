import { abs, bind_ubo, bind_vertex_data, clamp, cube_lines, distance2, get_sphere_lines, IOTA, mat4_rot_gx, mat4_rot_ly, mat4_scl, mat4_set_orthographic_projection, min, new_mat4, new_material, new_shader, new_ubo, rnd, SQRT1_3, update_ubo } from "../lib"
import { draw_axis, new_axis } from "../lib/axis"


declare const canvas: HTMLCanvasElement
canvas.style.imageRendering = "pixelated"

const gl = canvas.getContext("webgl2", {
  preserveDrawingBuffer: true,
  alpha:                 false,
  antialias:             false,
})!

gl.enable(gl.DEPTH_TEST)
gl.clearColor(0.1, 0.1, 0.1, 1)


//////// UBO
///////

const ubo = new_ubo(gl, 0, "Scene", 64 * 2, gl.DYNAMIC_DRAW)

const ubo_layout = /*glsl*/`
layout(std140) uniform Scene {
  mat4 world;
  mat4 proj;
};`

const enum UBO_OFFSET {
  world = 0,
  proj = 64,
}

const world = new_mat4()
mat4_scl(world, SQRT1_3)
update_ubo(gl, ubo, UBO_OFFSET.world, world)

const proj = new_mat4()


//////// SHARED FRAGMENT SHADER
///////

const frag_shader = new_shader(gl, gl.FRAGMENT_SHADER, /*glsl*/`
precision highp float;
in float z;
out vec3 Color;
float lift(float v, float t) { return v * (1.0 - t) + t; }
void main() {
  Color = vec3(lift(z, 0.1));
}`)!

const define_var_z = /*glsl*/"out float z;"
const set_var_z = /*glsl*/"z = 0.5 - gl_Position.z * 0.5;"


//////// SPHERE MATERIAL
///////

const pack = new_material<"apos" | "ipos" | "iradius">(gl, /*glsl*/`
in vec3 apos;
in vec3 ipos;
in float iradius;
${ubo_layout}
${define_var_z}
void main() {
  vec4 pos = vec4(apos * iradius + ipos, 1);
  gl_Position = proj * world * pos;
  ${set_var_z}
}`,
frag_shader,
)!

bind_ubo(gl, ubo, pack.id)


//////// PACK GEOMETRY
///////

const pack_vao = gl.createVertexArray()
gl.bindVertexArray(pack_vao)

const sphere_shape = get_sphere_lines(10, 6, 1)

const spheres_transform: number[] = []

{
  const MIN_R = 0.01
  const MAX_R = 0.33
  let i = 0, count = 0
  while (i++ < 10_000) {
    const x = rnd(-1, 1)
    const y = rnd(-1, 1)
    const z = rnd(-1, 1)
    const r = test_radius(x, y, z, count, MIN_R, MAX_R)
    if (r) {
      spheres_transform.push(x, y, z, r)
      count++
    }
  }
}

bind_vertex_data(gl, sphere_shape, [ pack.attributes.apos ])
bind_vertex_data(gl, new Float32Array(spheres_transform), [ pack.attributes.ipos, pack.attributes.iradius ], 1)

const pack_vertices = sphere_shape.length / 3
const pack_instances = spheres_transform.length >> 2


//////// CUBE
///////

const cube = new_material<"apos">(gl, /*glsl*/`
in vec3 apos;
${ubo_layout}
${define_var_z}
void main() {
  gl_Position = proj * world * vec4(apos, 1);
  ${set_var_z}
}`,
frag_shader,
)!

bind_ubo(gl, ubo, cube.id)

const cube_vao = gl.createVertexArray()
gl.bindVertexArray(cube_vao)
bind_vertex_data(gl, cube_lines, [ cube.attributes.apos ])
const cube_vertices = cube_lines.length / 3


//////// RENDER
///////

const axis = new_axis(gl, ubo_layout, `p=proj*world*p`)
bind_ubo(gl, ubo, axis.id)

let drawing = false

const request_draw = () => {
  if (drawing) return
  drawing = true
  requestAnimationFrame(draw)
}

const draw = () => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  gl.useProgram(pack.id)
  gl.bindVertexArray(pack_vao)
  gl.drawArraysInstanced(gl.LINES, 0, pack_vertices, pack_instances)

  gl.useProgram(cube.id)
  gl.bindVertexArray(cube_vao)
  gl.drawArrays(gl.LINES, 0, cube_vertices)

  gl.useProgram(axis.id)
  gl.bindVertexArray(axis.vao)
  draw_axis(gl)

  drawing = false
}

request_draw()


//////// SIMPLE ORBIT CONTROL
///////

const p = { x: 0, y: 0, up: true }

onpointerdown = (e) => {
  p.x = e.clientX
  p.y = e.clientY
  p.up = false
}

onpointercancel = onpointerup = () => {
  p.up = true
}

// accumulates dy to check polar overstep
let polar_angle = 0

onpointermove = (e) => {
  if (p.up) return

  const dx = (e.clientX - p.x) * 0.005
  const dy = (e.clientY - p.y) * 0.005
  p.x = e.clientX
  p.y = e.clientY

  mat4_rot_ly(world, -dx)
  const prev_polar = polar_angle
  polar_angle = clamp(polar_angle - dy, -IOTA, IOTA)
  mat4_rot_gx(world, polar_angle - prev_polar)
  update_ubo(gl, ubo, UBO_OFFSET.world, world)

  request_draw()
}


//////// HELPERS
///////

const resize = () => {
  const width  = canvas.width  = innerWidth
  const height = canvas.height = innerHeight
  gl.viewport(0, 0, width, height)

  const aspect = width / height
  mat4_set_orthographic_projection(proj, aspect * 2, 2, -1, 1)
  update_ubo(gl, ubo, UBO_OFFSET.proj, proj)

  request_draw()
}

resize()
addEventListener("resize", resize)


function test_radius(x: number, y: number, z: number, n: number, min_r: number, max_r: number) {
  let r = min(1 - abs(x), 1 - abs(y), 1 - abs(z))

  if (r <= min_r) {
    return 0
  }

  if (n === 0) {
    return min(r, max_r)
  }

  n <<= 2
  for (let i = 0; i < n; i += 4) {
    const xo = spheres_transform[i + 0]
    const yo = spheres_transform[i + 1]
    const zo = spheres_transform[i + 2]
    const ro = spheres_transform[i + 3]

    // test x-axiz, yz
    const yz = distance2(y, z, yo, zo)
    // test y-axis, xz
    const xz = distance2(x, z, xo, zo)
    // test z-axis, xy
    const xy = distance2(x, y, xo, yo)

    if (yz <= (ro + min_r) || xz <= (ro + min_r) || xy <= (ro + min_r)) {
      r = 0
      break
    }

    r = min(r, yz - ro, xz - ro, xy - ro)
  }

  return min(r, max_r)
}
