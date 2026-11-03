import { calc_texture_size, camera_set_perspective_projection, ceil, clamp, IOTA, mat4_compose_prs, mat4_mult, mat4_rot_gx, mat4_rot_ly, min, new_camera, new_mat4, new_material, new_texstore, subupload_texture, type Texture_Params, type Texture } from "../../lib"
import { load_ply, type Ply_Sorter_Input_Camera, type Ply_Sorter_Input_Data, type Ply_Sorter_Input_Header, type Ply_Sorter_Output, sorter_worker } from "../../lib/gs"
import { cprints, init_printer, new_worker } from "../../lib/helpers"

import frag from "./frag.glsl"
import vert from "./vert.glsl"



declare const canvas: HTMLCanvasElement
canvas.style.imageRendering = "pixelated"

const gl = canvas.getContext("webgl2", {
  alpha:     false,
  antialias: false,
})!

gl.enable(gl.BLEND)
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

init_printer()

const camera = new_camera(0, 0, -1, 0, 0, 0, innerWidth, innerHeight, 0.1, 10, 1, 72)


//////// MESH
///////

const vao = gl.createVertexArray()
gl.bindVertexArray(vao)

const gs = new_material<never, "splats_count" | "viewport" | "matrix_model" | "matrix_view" | "matrix_projection" | "position_map" | "rotation_map" | "scale_map" | "color_map" | "order_map">(gl, vert, frag)!
gl.useProgram(gs.id)

gl.uniformMatrix4fv(gs.uniforms.matrix_view, false, camera.view)

const model = new_mat4()

const loonie_transform = {
  position: [ 0, 0, 2 ],
  rotation: [ -0.05, 0, 0 ],
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
  request_draw()
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

let total_splats_num = 0
let loaded_splats_num = 0
let draw_splats_num = 0

load_ply(
  "./assets/loonie.ply",
  (header, count) => {
    total_splats_num = count
    console.log("HEADER", header)

    const s = calc_texture_size(count)
    const texels_len = s.width * s.height
    const txt_size = texels_len * 4

    pos_buf = new Float32Array(txt_size)
    rot_buf = new Float32Array(txt_size)
    scl_buf = new Float32Array(txt_size)
    col_buf = new Float32Array(txt_size)
    ord_buf = new Uint32Array(texels_len)

    const rgbaf32: Texture_Params = { internal_format: gl.RGBA32F }
    pos_txt = new_texstore(gl, 0, s.width, s.height, rgbaf32)
    rot_txt = new_texstore(gl, 1, s.width, s.height, rgbaf32)
    scl_txt = new_texstore(gl, 2, s.width, s.height, rgbaf32)
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
  },
  data => {
    append(pos_txt!, pos_buf!, data.position, data.offset, data.count)
    append(rot_txt!, rot_buf!, data.rotation, data.offset, data.count)
    append(scl_txt!, scl_buf!, data.scale,    data.offset, data.count)
    append(col_txt!, col_buf!, data.color,    data.offset, data.count)

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
  offset: number,
  count:  number,
) => {
  store.set(data, offset << 2)

  const yoffset    = offset / txt.width | 0
  const new_height = ceil((offset + count) / txt.width)
  const sub_height = new_height - yoffset

  const begin  = yoffset * txt.width << 2
  const end = new_height * txt.width << 2
  const sub_data = store.subarray(begin, end)

  subupload_texture(gl, txt, 0, yoffset, txt.width, sub_height, sub_data)
}


//////// RENDER
///////

let drawing = false

const draw = () => {
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, draw_splats_num)
  drawing = false
}

const request_draw = () => {
  if (drawing) return
  drawing = true
  requestAnimationFrame(draw)
}


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
  // send_camera()
  request_draw()
}


//////// RESIZE
///////

const pr = min(2, devicePixelRatio)

const resize = () => {
  camera.width  = canvas.width  = innerWidth  * pr
  camera.height = canvas.height = innerHeight * pr
  camera_set_perspective_projection(camera)
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.uniform2f(gs.uniforms.viewport, canvas.width, canvas.height)
  gl.uniformMatrix4fv(gs.uniforms.matrix_projection, false, camera.proj)
  // send_camera()
  request_draw()
}

resize()
addEventListener("resize", resize)
