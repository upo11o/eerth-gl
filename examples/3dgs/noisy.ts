import { bind_quad_vao, calc_texture_size, camera_set_perspective_projection, ceil, clamp, IOTA, mat4_compose_prs, mat4_mult, mat4_rot_gx, mat4_rot_ly, min, new_camera, new_feedback_render_target, new_mat4, new_material, new_quad_material, new_texstore, render_quad, subupload_texture, swap_feedback_render_target, use_texture, type Feedback_Render_Target, type Material, type Texture_Params, type Texture } from "../../lib"
import { load_ply, type Ply_Sorter_Input_Camera, type Ply_Sorter_Input_Data, type Ply_Sorter_Input_Header, type Ply_Sorter_Output, sorter_worker } from "../../lib/gs"
import { cprints, init_printer, new_worker } from "../../lib/helpers"

import advect_src from "./advect.glsl"
import flow_src from "./flow.glsl"
import frag from "./noisy-frag.glsl"
import vert_src from "./noisy-vert.glsl"
import psrdnoise_src from "./psrdnoise3.glsl"



declare const canvas: HTMLCanvasElement
canvas.style.imageRendering = "pixelated"

const gl = canvas.getContext("webgl2", {
  alpha:     false,
  antialias: false,
})!

// float state texture must be renderable
if (!gl.getExtension("EXT_color_buffer_float")) {
  throw new Error("EXT_color_buffer_float is not supported")
}

gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

init_printer()

const include = (src: string) => src
  .replace("//#include psrdnoise", psrdnoise_src)
  .replace("//#include flow", flow_src)

const vert = include(vert_src)
const advect_frag = include(advect_src)

const camera = new_camera(0, 0, -3, 0, 0, 0, innerWidth, innerHeight, 0.1, 10, 1, 60)


//////// MESH
///////

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

type Flow_Uniform = "flow_seed" | "flow_fade" | "flow_speed" | "flow_limit"

const gs = new_material<never, Flow_Uniform | "splats_count" | "viewport" | "matrix_model" | "matrix_view" | "matrix_projection" | "position_map" | "state_map" | "flowing" | "rotation_map" | "scale_map" | "color_map" | "order_map">(gl, vert, frag)!
gl.useProgram(gs.id)

gl.uniformMatrix4fv(gs.uniforms.matrix_view, false, camera.view)

const model = new_mat4()

const loonie_transform = {
  position: [ 0, 0, 0 ],
  rotation: [ -0.5, 1.5, 0 ],
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
  gl.uniform1ui(gs.uniforms.splats_count, draw_splats_num)

  if (draw_splats_num) {
    ord_buf.set(e.data.order)
    const height = ceil(draw_splats_num / ord_txt.width)
    subupload_texture(gl, ord_txt, 0, 0, ord_txt.width, height, ord_buf.subarray(0, height * ord_txt.width))
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
    ord_buf: Uint32Array,
    stt_buf: Float32Array

let total_splats_num = 0
let loaded_splats_num = 0
let draw_splats_num = 0

load_ply(
  "./assets/cliff.ply",
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
    stt_buf = new Float32Array(txt_size4)

    const rgbaf32: Texture_Params = { internal_format: gl.RGBA32F }
    const rgbf32: Texture_Params  = { internal_format: gl.RGB32F }
    pos_txt = new_texstore(gl, 0, s.width, s.height, rgbf32)
    rot_txt = new_texstore(gl, 1, s.width, s.height, rgbaf32)
    scl_txt = new_texstore(gl, 2, s.width, s.height, rgbf32)
    col_txt = new_texstore(gl, 3, s.width, s.height, rgbaf32)
    ord_txt = new_texstore(gl, 4, s.width, s.height, { internal_format: gl.R32UI }, ord_buf)

    gl.uniform1i(gs.uniforms.position_map, pos_txt.id)
    gl.uniform1i(gs.uniforms.rotation_map, rot_txt.id)
    gl.uniform1i(gs.uniforms.scale_map,    scl_txt.id)
    gl.uniform1i(gs.uniforms.color_map,    col_txt.id)
    gl.uniform1i(gs.uniforms.order_map,    ord_txt.id)

    const header_message: Ply_Sorter_Input_Header = { type: "header", count }
    sorter.postMessage(header_message)
    send_camera()

    // RGB32F is not color-renderable, so the state needs RGBA32F
    noise_rt = new_feedback_render_target(gl, s.width, s.height, STATE_UNIT, rgbaf32)
    gl.uniform1i(gs.uniforms.state_map, STATE_UNIT)
  },
  data => {
    // state: origin position with t = -1, which marks it as just loaded
    const state = new Float32Array(data.count * 4)
    for (let i = 0; i < data.count; i++) {
      state[i * 4]     = data.position[i * 3]
      state[i * 4 + 1] = data.position[i * 3 + 1]
      state[i * 4 + 2] = data.position[i * 3 + 2]
      state[i * 4 + 3] = -1
    }
    append(noise_rt.read, stt_buf!, state, 4, data.offset, data.count)
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


//////// NOISE
///////

const STATE_UNIT = 5
let noise_rt: Feedback_Render_Target

// per splat values are picked between [ min, max ] by a hash of its id and seed
const flow = {
  /** salt of the per splat hash, change it to reroll speed and limit of every splat */
  seed:   1,
  /** [ in, out ] each 0..0.5, share of the limit spent morphing from a gaussian splat into a solid quad after a restart, and fading alpha out before it, 0 means instant */
  fade:   [ 0.5, 0.5 ],
  /** [ min, max ] multiplier of the curl velocity, the raw curl is not normalized, so tune by eye */
  speed:  [ 0.001, 0.01 ],
  /** [ min, max ] seconds a splat travels before it restarts from its origin */
  limit:  [ 4.2, 7.8 ],
  /** noise frequency, higher gives smaller and tighter swirls */
  freq:   0.5,
  /** how fast the field itself changes over time (gradient rotation per second), 0 freezes it into fixed streamlines */
  evolve: 0.1,
}

const advect = new_quad_material<Flow_Uniform | "state_map" | "position_map" | "loaded_count" | "dt" | "flow_time" | "flow_freq" | "flow_evolve">(gl, advect_frag)

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
gl.uniform1i(advect.uniforms.position_map, 0)
gl.uniform1i(advect.uniforms.state_map, STATE_UNIT)

// outside of frame() gs stays the current program, handlers set its uniforms
gl.useProgram(gs.id)

const advect_step = (time: number, dt: number) => {
  gl.useProgram(advect.id)
  bind_quad_vao(gl)
  gl.uniform1ui(advect.uniforms.loaded_count, loaded_splats_num)
  gl.uniform1f(advect.uniforms.dt, dt)
  gl.uniform1f(advect.uniforms.flow_time, time)

  use_texture(gl, noise_rt.read)
  gl.bindFramebuffer(gl.FRAMEBUFFER, noise_rt.write.fbo)
  gl.viewport(0, 0, noise_rt.width, noise_rt.height)
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

  gl.disable(gl.BLEND)
  advect_step(time, dt)

  gl.enable(gl.BLEND)
  gl.useProgram(gs.id)
  gl.bindVertexArray(vao)
  use_texture(gl, noise_rt.read)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, camera.width, camera.height)

  // origins first, flowing splats blend over them
  gl.uniform1i(gs.uniforms.flowing, 0)
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, draw_splats_num)
  gl.uniform1i(gs.uniforms.flowing, 1)
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, draw_splats_num)
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
  camera.width  = canvas.width  = innerWidth  * pr | 0
  camera.height = canvas.height = innerHeight * pr | 0
  camera_set_perspective_projection(camera)
  gl.viewport(0, 0, camera.width, camera.height)
  gl.uniform2f(gs.uniforms.viewport, camera.width, camera.height)
  gl.uniformMatrix4fv(gs.uniforms.matrix_projection, false, camera.proj)
  send_camera()
}

resize()
addEventListener("resize", resize)
