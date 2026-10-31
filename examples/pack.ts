import { bind_ubo, bind_vertex_data, clamp, cprints, cube_lines, draw_axis, get_icosahedron, init_printer, IOTA, mat4_rot_gx, mat4_rot_ly, mat4_scl, mat4_set_orthographic_projection, new_axis, new_mat4, new_material, new_shader, new_ubo, new_worker, prints, SQRT1_3, tris_to_lines, update_ubo } from "../lib"


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
  float d = z * z;
  Color = vec3(lift(d * (2.0 - d), 0.1));
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

init_printer(null, "margin: 8px")

const pack_vao = gl.createVertexArray()
gl.bindVertexArray(pack_vao)

const icosa = get_icosahedron(1, 1)
const sphere_lines = tris_to_lines(icosa, 3)
bind_vertex_data(gl, sphere_lines, [ pack.attributes.apos ])
const sphere_vertices = sphere_lines.length / 3

const MAX_TRIES = 1000_000
const MAX_COUNT = 2000
const MIN_R = 0.01
const MAX_R = 0.33

let sphere_instances = 0
const ivbo = bind_vertex_data(gl, MAX_COUNT << 4, [ pack.attributes.ipos, pack.attributes.iradius ], 1).vbo

const pack_start_time = performance.now()
let worker = new_worker(`(${worker_self})(${MAX_TRIES},${MAX_COUNT},${MIN_R},${MAX_R})`)
const instance_dummy = new Float32Array(4)

worker.onmessage = e => {
  if (e.data.done) {
    const pack_time = (performance.now() - pack_start_time) * 0.001
    prints("\ndone in", `${pack_time.toFixed(3)}s`)
    worker.terminate()
    worker = null!
    return
  }
  instance_dummy.set(e.data)
  gl.bindBuffer(gl.ARRAY_BUFFER, ivbo)
  gl.bufferSubData(gl.ARRAY_BUFFER, sphere_instances++ << 4, instance_dummy)
  request_draw()
  cprints(sphere_instances, "spheres")
}


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
  gl.drawArraysInstanced(gl.LINES, 0, sphere_vertices, sphere_instances)

  gl.useProgram(cube.id)
  gl.bindVertexArray(cube_vao)
  gl.drawArrays(gl.LINES, 0, cube_vertices)

  gl.useProgram(axis.id)
  gl.bindVertexArray(axis.vao)
  gl.clear(gl.DEPTH_BUFFER_BIT)
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


//////// RESIZE HANDLER
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


//////// WORKER
///////

function worker_self(
  MAX_TRIES: number,
  MAX_COUNT: number,
  MIN_R: number,
  MAX_R: number,
) {
  const store: number[] = []
  let tries = 0, count = 0

  while (tries++ < MAX_TRIES && count < MAX_COUNT) {
    const x = Math.random() * 2 - 1
    const y = Math.random() * 2 - 1
    const z = Math.random() * 2 - 1
    const r = test_radius(x, y, z)
    if (r) {
      count++
      store.push(x, y, z, r)
      postMessage([ x, y, z, r ])
    }
  }

  postMessage({ done: true })

  function test_radius(x: number, y: number, z: number) {
    let r = Math.min(1 - Math.abs(x), 1 - Math.abs(y), 1 - Math.abs(z))

    if (r <= MIN_R) {
      return 0
    }

    if (count === 0) {
      return Math.min(r, MAX_R)
    }

    const n = count << 2
    for (let i = 0; i < n; i += 4) {
      const xo = store[i + 0]
      const yo = store[i + 1]
      const zo = store[i + 2]
      const ro = store[i + 3]

      // test x-axiz, yz
      const yz = Math.hypot(y - yo, z - zo)
      // test y-axis, xz
      const xz = Math.hypot(x - xo, z - zo)
      // test z-axis, xy
      const xy = Math.hypot(x - xo, y - yo)

      if (yz <= (ro + MIN_R) || xz <= (ro + MIN_R) || xy <= (ro + MIN_R)) {
        r = 0
        break
      }

      r = Math.min(r, yz - ro, xz - ro, xy - ro)
    }

    return Math.min(r, MAX_R)
  }
}

