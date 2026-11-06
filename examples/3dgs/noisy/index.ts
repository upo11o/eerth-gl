import { bind_quad_vao, calc_texture_size, camera_set_perspective_projection, ceil, clamp, IOTA, mat4_compose_prs, max, mat4_mult, mat4_rot_gx, mat4_rot_ly, min, new_camera, new_feedback_multiple_render_target, new_mat4, new_material, new_quad_material, new_texstore, render_quad, subupload_texture, swap_feedback_render_target, use_texture, type Feedback_Multiple_Render_Target, type Material, type Texture_Params, type Texture, camera_update_mat, mat4_invert } from "../../../lib"
import { load_ply, type Ply_Parser_Output, type Ply_Sorter_Input_Camera, type Ply_Sorter_Input_Data, type Ply_Sorter_Input_Header, type Ply_Sorter_Output, sorter_worker } from "../../../lib/gs"
import { cprints, init_printer, new_worker } from "../../../lib/helpers"

import psrdnoise_src from "./psrdnoise3.glsl"
import flow_src from "./flow.glsl"
import advect_src from "./advect.glsl"
import vert_src from "./vert.glsl"
import frag_src from "./frag.glsl"



declare const canvas: HTMLCanvasElement
canvas.style.imageRendering = "pixelated"

canvas.style.position = "absolute"
canvas.style.bottom = "0"
canvas.style.left = "0"
canvas.style.width = "800px"
canvas.style.height = "800px"

const gl = canvas.getContext("webgl2", {
  alpha:     false,
  antialias: false,
})!

// float state texture must be renderable
if (!gl.getExtension("EXT_color_buffer_float")) {
  throw new Error("EXT_color_buffer_float is not supported")
}

gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

init_printer(null, "bottom:780px;top:auto")

const include = (src: string) => src
  .replace("//#include psrdnoise", psrdnoise_src)
  .replace("//#include flow", flow_src)

// quads per instance, one small index buffer is drawn instanced over all splats
const SPLAT_BATCH = 128

const vert = include(vert_src)
  .replace("//#define SPLAT_BATCH", `#define SPLAT_BATCH ${SPLAT_BATCH}u`)
const advect_frag = include(advect_src)


//////// CAMERA
///////

const camera_moving = { x: 0, y: 0, z: 0 }

const camera = new_camera(0, 0, -3, 0, 0, 0, innerWidth, innerHeight, 0.1, 10, 1, 60)
addEventListener("keypress", e => {
  if (e.key === "w") camera_moving.z = 1
  else if (e.key === "s") camera_moving.z = -1
  else if (e.key === "a") camera_moving.x = -1
  else if (e.key === "d") camera_moving.x = 1
  else if (e.key === "q") camera_moving.y = 1
  else if (e.key === "e") camera_moving.y = -1
})

addEventListener("keyup", () => {
  camera_moving.x =
    camera_moving.y =
      camera_moving.z = 0
})


//////// MESH
///////

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

// two triangles per quad, gl_VertexID is the index, so the shader gets quad = id >> 2 and corner = id & 3
// shared corners repeat close together, so the post-transform cache shades ~4 vertices per quad, not 6
const indices = new Uint16Array(SPLAT_BATCH * 6)
for (let i = 0, v = 0; i < SPLAT_BATCH; i++, v += 4) {
  indices.set([ v, v + 1, v + 2, v + 2, v + 1, v + 3 ], i * 6)
}
// element buffer binding is vao state
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer())
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

const draw_splats = (count: number) => {
  gl.uniform1ui(gs.uniforms.splats_count, count)
  gl.drawElementsInstanced(gl.TRIANGLES, SPLAT_BATCH * 6, gl.UNSIGNED_SHORT, 0, ceil(count / SPLAT_BATCH))
}

type Flow_Uniform = "flow_seed" | "flow_fade" | "flow_speed" | "flow_limit"

const gs = new_material<never, Flow_Uniform | "splats_count" | "viewport" | "matrix_model" | "matrix_view" | "matrix_projection" | "position_map" | "state_map" | "rotation_state_map" | "flow_id_map" | "flow_order_map" | "flowing" | "light_dir" | "light_shininess" | "light_intensity" | "rotation_map" | "scale_map" | "color_map" | "order_map">(gl, vert, frag_src)!
gl.useProgram(gs.id)

gl.uniformMatrix4fv(gs.uniforms.matrix_view, false, camera.view)

const model = new_mat4()

const loonie_transform = {
  position: [ 0, -0.25, -2 ],
  rotation: [ 0, 0, 0 ],
  scale:    [ 1, -1, 1 ],
} as const

mat4_compose_prs(
  model,
  ...loonie_transform.position,
  ...loonie_transform.rotation,
  ...loonie_transform.scale,
)
gl.uniformMatrix4fv(gs.uniforms.matrix_model, false, model)


//////// SORTER
///////

const sorter = new_worker(`(${sorter_worker})()`)

const model_view = new_mat4()
const camera_message: Ply_Sorter_Input_Camera = {
  type:  "camera",
  delay: 0,
  model_view,
  proj:  camera.proj,
}
const data_message: Ply_Sorter_Input_Data = {
  type:     "data",
  delay:    100,
  position: null!,
  offset:   0,
  count:    0,
}

const send_camera = () => {
  mat4_mult(camera.view, model, model_view)
  sorter.postMessage(camera_message)
}

sorter.onmessage = (e: MessageEvent<Ply_Sorter_Output>) => {
  draw_splats_num = e.data.count
  if (!draw_splats_num) return

  ord_buf.set(e.data.order)
  const height = ceil(draw_splats_num / ord_txt.width)
  subupload_texture(gl, ord_txt, 0, 0, ord_txt.width, height, ord_buf.subarray(0, height * ord_txt.width))

  // flowing slots in the same back to front order
  let k = 0
  for (let i = 0; i < draw_splats_num; i++) {
    const slot = slot_of[ord_buf[i]]
    if (slot >= 0) flow_ord_buf[k++] = slot
  }
  flow_draw_num = k
  if (k) {
    const rows = ceil(k / flow_width)
    subupload_texture(gl, flow_ord_txt, 0, 0, flow_width, rows, flow_ord_buf.subarray(0, rows * flow_width))
  }
}


//////// PLY LOADER
///////

let pos_txt: Texture,
    rot_txt: Texture,
    scl_txt: Texture,
    col_txt: Texture,
    ord_txt: Texture
let pos_buf: Float32Array,
    rot_buf: Float32Array,
    scl_buf: Float32Array,
    col_buf: Float32Array,
    ord_buf: Uint32Array

const rgbaf32: Texture_Params = { internal_format: gl.RGBA32F }
const rgbf32: Texture_Params  = { internal_format: gl.RGB32F }
const r32ui: Texture_Params   = { internal_format: gl.R32UI }

let total_splats_num = 0
let loaded_splats_num = 0
let draw_splats_num = 0

load_ply(
  "./assets/moon.ply",
  (header, count) => {
    total_splats_num = count
    console.log("HEADER", header)

    const s = calc_texture_size(count)
    const texels_len = s.width * s.height
    const txt_size4 = texels_len * 4
    const txt_size3 = texels_len * 3

    pos_buf = new Float32Array(txt_size3)
    rot_buf = new Float32Array(txt_size4)
    scl_buf = new Float32Array(txt_size3)
    col_buf = new Float32Array(txt_size4)
    ord_buf = new Uint32Array(texels_len)

    slot_of      = new Int32Array(count).fill(-1)
    slot_ids     = new Uint32Array(texels_len)
    flow_ord_buf = new Uint32Array(texels_len)
    flow_width    = s.width
    flow_max_rows = s.height

    pos_txt = new_texstore(gl, 0, s.width, s.height, rgbf32)
    rot_txt = new_texstore(gl, 1, s.width, s.height, rgbaf32)
    scl_txt = new_texstore(gl, 2, s.width, s.height, rgbf32)
    col_txt = new_texstore(gl, 3, s.width, s.height, rgbaf32)
    ord_txt = new_texstore(gl, 4, s.width, s.height, r32ui, ord_buf)

    gl.uniform1i(gs.uniforms.position_map, pos_txt.id)
    gl.uniform1i(gs.uniforms.rotation_map, rot_txt.id)
    gl.uniform1i(gs.uniforms.scale_map,    scl_txt.id)
    gl.uniform1i(gs.uniforms.color_map,    col_txt.id)
    gl.uniform1i(gs.uniforms.order_map,    ord_txt.id)

    const header_message: Ply_Sorter_Input_Header = { type: "header", count }
    sorter.postMessage(header_message)
    send_camera()
  },
  data => {
    // before data.position is handed over to the sorter
    pick_flowing(data)
    append(pos_txt!, pos_buf!, data.position, 3, data.offset, data.count)
    append(rot_txt!, rot_buf!, data.rotation, 4, data.offset, data.count)
    append(scl_txt!, scl_buf!, data.scale,    3, data.offset, data.count)
    append(col_txt!, col_buf!, data.color,    4, data.offset, data.count)

    data_message.position = data.position
    data_message.offset = data.offset
    data_message.count = data.count
    // pos_buf keeps its own copy, so the chunk can be handed over
    sorter.postMessage(data_message, [ data.position.buffer ])

    loaded_splats_num += data.count
    cprints(loaded_splats_num, "of", total_splats_num)
  },
  () => {
    console.log("DONE")
  },
)

const append = (
  txt:    Texture,
  store:  TypedArray,
  data:   TypedArray,
  stride: number,
  offset: number,
  count:  number,
) => {
  store.set(data, offset * stride)

  const yoffset    = offset / txt.width | 0
  const new_height = ceil((offset + count) / txt.width)
  const sub_height = new_height - yoffset

  const begin  = yoffset * txt.width * stride
  const end = new_height * txt.width * stride
  const sub_data = store.subarray(begin, end)

  subupload_texture(gl, txt, 0, yoffset, txt.width, sub_height, sub_data)
}

// uploads exactly [offset, offset + count) texels, unlike append it never rewrites texels around the range
const upload_range = (
  txt:    Texture,
  data:   TypedArray,
  stride: number,
  offset: number,
  count:  number,
) => {
  const w = txt.width
  let i = 0
  while (i < count) {
    const x = (offset + i) % w
    const y = (offset + i) / w | 0
    // whole rows at once, a partial row on its own
    const rows = x ? 0 : (count - i) / w | 0
    const n = rows ? rows * w : min(count - i, w - x)
    subupload_texture(gl, txt, x, y, rows ? w : n, rows || 1, data.subarray(i * stride, (i + n) * stride))
    i += n
  }
}


//////// NOISE
///////

const STATE_UNIT      = 5
const FLOW_IDS_UNIT   = 6
const FLOW_ORDER_UNIT = 7
const ROTATION_UNIT   = 8

type Flow_State = "state" | "rotation"
// attachment order, matches the outputs of advect.glsl
const FLOW_STATES: Flow_State[] = [ "state", "rotation" ]

// only splats that pass the scale check get a slot, all flow textures share width and rows
let noise_rt:     Feedback_Multiple_Render_Target<Flow_State>
let flow_ids_txt: Texture
let flow_ord_txt: Texture

/** splat id -> slot, -1 for splats that do not flow */
let slot_of:      Int32Array
/** slot -> splat id */
let slot_ids:     Uint32Array
let flow_ord_buf: Uint32Array

let flow_width     = 0
let flow_rows      = 0
let flow_max_rows  = 0
let flow_slots_num = 0
let flow_draw_num  = 0

// grows flow textures by doubling rows, keeps the state of splats that already flow
const ensure_flow_capacity = (count: number) => {
  if (count <= flow_rows * flow_width) return

  let rows = flow_rows || 16
  while (rows * flow_width < count) rows *= 2
  rows = min(rows, flow_max_rows)
  const len = rows * flow_width

  // RGB32F is not color-renderable, so the state needs RGBA32F
  const rt  = new_feedback_multiple_render_target(gl, flow_width, rows, {
    state:    { id: STATE_UNIT,    params: rgbaf32 },
    rotation: { id: ROTATION_UNIT, params: rgbaf32 },
  })
  const ids = new_texstore(gl, FLOW_IDS_UNIT, flow_width, rows, r32ui, slot_ids.subarray(0, len))
  const ord = new_texstore(gl, FLOW_ORDER_UNIT, flow_width, rows, r32ui, flow_ord_buf.subarray(0, len))

  if (flow_rows) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, noise_rt.read.fbo)
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rt.read.fbo)
    // blit writes into every draw buffer, so one attachment at a time
    const none: number[] = FLOW_STATES.map(() => gl.NONE)
    FLOW_STATES.forEach((_, i) => {
      const draw = none.slice()
      draw[i] = gl.COLOR_ATTACHMENT0 + i
      gl.readBuffer(gl.COLOR_ATTACHMENT0 + i)
      gl.drawBuffers(draw)
      gl.blitFramebuffer(0, 0, flow_width, flow_rows, 0, 0, flow_width, flow_rows, gl.COLOR_BUFFER_BIT, gl.NEAREST)
    })
    gl.drawBuffers(FLOW_STATES.map((_, i) => gl.COLOR_ATTACHMENT0 + i))
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    for (const target of [ noise_rt.read, noise_rt.write ]) {
      gl.deleteFramebuffer(target.fbo)
      for (const name of FLOW_STATES) gl.deleteTexture(target.attach[name].txt)
    }
    gl.deleteTexture(flow_ids_txt.txt)
    gl.deleteTexture(flow_ord_txt.txt)
  }

  noise_rt     = rt
  flow_ids_txt = ids
  flow_ord_txt = ord
  flow_rows    = rows
}

// splats with the largest scale axis within flow.scale get the next slots
const pick_flowing = (data: Ply_Parser_Output) => {
  const state    = new Float32Array(data.count * 4)
  const rotation = new Float32Array(data.count * 4)
  const ids      = new Uint32Array(data.count)
  let n = 0

  for (let i = 0; i < data.count; i++) {
    const i3 = i * 3
    const scale = max(data.scale[i3], data.scale[i3 + 1], data.scale[i3 + 2])
    if (scale < flow.scale[0] || scale > flow.scale[1]) continue

    const id = data.offset + i
    slot_of[id] = flow_slots_num + n
    ids[n] = id
    // origin position with t = -1, which marks it as just loaded
    state[n * 4]     = data.position[i3]
    state[n * 4 + 1] = data.position[i3 + 1]
    state[n * 4 + 2] = data.position[i3 + 2]
    state[n * 4 + 3] = -1
    rotation.set(data.rotation.subarray(i * 4, i * 4 + 4), n * 4)
    n++
  }
  if (!n) return

  ensure_flow_capacity(flow_slots_num + n)
  slot_ids.set(ids.subarray(0, n), flow_slots_num)
  upload_range(noise_rt.read.attach.state, state, 4, flow_slots_num, n)
  upload_range(noise_rt.read.attach.rotation, rotation, 4, flow_slots_num, n)
  upload_range(flow_ids_txt, ids, 1, flow_slots_num, n)
  flow_slots_num += n
}

// per splat values are picked between [ min, max ] by a hash of its id and seed
const flow = {
  /** salt of the per splat hash and of the noise field, change it to reroll speed and limit of every splat and get another flow field */
  seed:   2,
  /** [ in, out ] each 0..0.5, share of the limit spent morphing from a gaussian splat into a solid quad after a restart, and fading alpha out before it, 0 means instant */
  fade:   [ 0.5, 0.5 ],
  /** [ min, max ] multiplier of the curl velocity, the raw curl is not normalized, so tune by eye */
  speed:  [ 0.002, 0.02 ],
  /** [ min, max ] seconds a splat travels before it restarts from its origin */
  limit:  [ 1, 7 ],
  /** [ min, max ] largest scale axis (model space) of a splat that flows, the rest only stay at origin */
  scale:  [ 0.005, 0.01 ],
  /** noise frequency, higher gives smaller and tighter swirls */
  freq:   0.6,
  /** how fast the field itself changes over time (gradient rotation per second), 0 freezes it into fixed streamlines */
  evolve: 0.2,
  /** how fast a splat turns its longest axis along the flow, 1 / seconds, 0 keeps the loaded rotation */
  turn:   4,
}

const advect = new_quad_material<Flow_Uniform | "state_map" | "rotation_state_map" | "flow_id_map" | "position_map" | "rotation_map" | "scale_map" | "flow_count" | "dt" | "flow_time" | "flow_freq" | "flow_evolve" | "flow_turn">(gl, advect_frag)

const set_flow_uniforms = (m: Material<never, Flow_Uniform>) => {
  gl.useProgram(m.id)
  gl.uniform1ui(m.uniforms.flow_seed, flow.seed)
  gl.uniform2fv(m.uniforms.flow_fade, flow.fade)
  gl.uniform2fv(m.uniforms.flow_speed, flow.speed)
  gl.uniform2fv(m.uniforms.flow_limit, flow.limit)
}

set_flow_uniforms(gs)
set_flow_uniforms(advect)
gl.uniform1f(advect.uniforms.flow_freq, flow.freq)
gl.uniform1f(advect.uniforms.flow_evolve, flow.evolve)
gl.uniform1f(advect.uniforms.flow_turn, flow.turn)
gl.uniform1i(advect.uniforms.position_map, 0)
gl.uniform1i(advect.uniforms.rotation_map, 1)
gl.uniform1i(advect.uniforms.scale_map, 2)
gl.uniform1i(advect.uniforms.state_map, STATE_UNIT)
gl.uniform1i(advect.uniforms.rotation_state_map, ROTATION_UNIT)
gl.uniform1i(advect.uniforms.flow_id_map, FLOW_IDS_UNIT)

// outside of frame() gs stays the current program, handlers set its uniforms
gl.useProgram(gs.id)
gl.uniform1i(gs.uniforms.state_map, STATE_UNIT)
gl.uniform1i(gs.uniforms.rotation_state_map, ROTATION_UNIT)
gl.uniform1i(gs.uniforms.flow_id_map, FLOW_IDS_UNIT)
gl.uniform1i(gs.uniforms.flow_order_map, FLOW_ORDER_UNIT)

// flowing splats blink when their glint points at the camera, origins keep their baked color
const light = {
  /** world space direction from a surface towards the light, normalized in the shader */
  dir:       [ 0, 1, -0.5 ],
  /** specular exponent, higher gives shorter, sharper blinks */
  shininess: 16,
  /** brightness added at the peak of a blink */
  intensity: 0.5,
}

gl.uniform3fv(gs.uniforms.light_dir, light.dir)
gl.uniform1f(gs.uniforms.light_shininess, light.shininess)
gl.uniform1f(gs.uniforms.light_intensity, light.intensity)

const use_flow_state = () => {
  for (const name of FLOW_STATES) use_texture(gl, noise_rt.read.attach[name])
}

const advect_step = (time: number, dt: number) => {
  gl.useProgram(advect.id)
  bind_quad_vao(gl)
  gl.uniform1ui(advect.uniforms.flow_count, flow_slots_num)
  gl.uniform1f(advect.uniforms.dt, dt)
  gl.uniform1f(advect.uniforms.flow_time, time)

  use_flow_state()
  gl.bindFramebuffer(gl.FRAMEBUFFER, noise_rt.write.fbo)
  // only rows with slots
  gl.viewport(0, 0, flow_width, ceil(flow_slots_num / flow_width))
  render_quad(gl)

  swap_feedback_render_target(noise_rt)
}


//////// RENDER
///////

let last_time = 0

const frame = (now: number) => {
  requestAnimationFrame(frame)

  const time = now / 1000
  // clamp, so a background tab does not throw splats far away
  const dt = min(time - last_time, 1 / 30)
  last_time = time

  if (!loaded_splats_num) return

  if (flow_slots_num) {
    gl.disable(gl.BLEND)
    advect_step(time, dt)
  }

  gl.enable(gl.BLEND)
  gl.useProgram(gs.id)
  gl.bindVertexArray(vao)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, camera.width, camera.height)

  if (camera_moving.x || camera_moving.y || camera_moving.z) {
    camera.pos[0] += camera_moving.x * dt
    camera.pos[1] += camera_moving.y * dt
    camera.pos[2] += camera_moving.z * dt
    mat4_invert(camera.mat, camera.view)
    gl.uniformMatrix4fv(gs.uniforms.matrix_view, false, camera.view)
    send_camera()
  }

  // origins first, flowing splats blend over them
  gl.uniform1i(gs.uniforms.flowing, 0)
  draw_splats(draw_splats_num)

  if (flow_draw_num) {
    use_flow_state()
    gl.uniform1i(gs.uniforms.flowing, 1)
    draw_splats(flow_draw_num)
  }
}

requestAnimationFrame(frame)


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
  const dy = (p.y - e.clientY) * 0.005
  p.x = e.clientX
  p.y = e.clientY

  mat4_rot_ly(model, -dx)
  const prev_polar = polar_angle
  polar_angle = clamp(polar_angle - dy, -IOTA, IOTA)
  mat4_rot_gx(model, prev_polar - polar_angle)
  gl.uniformMatrix4fv(gs.uniforms.matrix_model, false, model)
  send_camera()
}


//////// RESIZE
///////

const pr = min(2, devicePixelRatio)

const resize = () => {
  camera.width  = canvas.width  = 800 * pr | 0
  camera.height = canvas.height = 800 * pr | 0
  // camera.width  = canvas.width  = innerWidth  * pr | 0
  // camera.height = canvas.height = innerHeight * pr | 0
  camera_set_perspective_projection(camera)
  gl.viewport(0, 0, camera.width, camera.height)
  gl.uniform2f(gs.uniforms.viewport, camera.width, camera.height)
  gl.uniformMatrix4fv(gs.uniforms.matrix_projection, false, camera.proj)
  send_camera()
}

resize()
addEventListener("resize", resize)
