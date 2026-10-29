import { new_vec3_from_buffer, vec3_set } from "./vec"
import { mat4_invert, mat4_look_at, mat4_set_orthographic_projection, mat4_set_perspective_projection, new_mat4_from_buffer } from "./mat4"


export const enum Camera_Projection_Type {
  orthographic,
  perspective,
}

export type Camera = {
  type: Camera_Projection_Type

  mat:    Float32Array
  pos:    Float32Array
  view:   Float32Array
  proj:   Float32Array
  target: Float32Array

  width:  number
  height: number
  near:   number
  far:    number
  fov:    number

  webgpu:    boolean
  left_hand: boolean
}

export const new_camera = (
  px: number, py: number, pz: number,
  tx: number, ty: number, tz: number,
  width: number, height: number,
  near: number, far:  number,
  type = Camera_Projection_Type.orthographic,
  fov = 60,
  webgpu = false,
  left_hand = true,
): Camera => {
  const buf = new ArrayBuffer(64 * 3 + 12)
  const mat    = new_mat4_from_buffer(buf, 0)
  // pos is a view over [12, 13, 14] mat elements
  const pos    = new_vec3_from_buffer(buf, 48)
  const view   = new_mat4_from_buffer(buf, 64)
  const proj   = new_mat4_from_buffer(buf, 128)
  const target = new_vec3_from_buffer(buf, 192)

  const camera: Camera = {
    type,
    mat,
    pos,
    view,
    proj,
    target,
    width,
    height,
    near,
    far,
    fov,
    webgpu,
    left_hand,
  }

  vec3_set(pos,    px, py, pz)
  vec3_set(target, tx, ty, tz)
  camera_update_mat(camera)
  if (camera.type === Camera_Projection_Type.perspective) {
    camera_set_orthographic_projection(camera)
  } else {
    camera_set_orthographic_projection(camera)
  }

  return camera
}


export const camera_update_mat = (camera: Camera) => {
  const t = camera.target
  mat4_look_at(camera.mat, t[0], t[1], t[2], true)
  mat4_invert(camera.mat, camera.view)
}


export const camera_set_perspective_projection = (camera: Camera) => {
  mat4_set_perspective_projection(
    camera.proj,
    camera.fov,
    camera.width / camera.height,
    camera.near,
    camera.far,
    camera.webgpu,
    camera.left_hand,
  )
}


export const camera_set_orthographic_projection = (camera: Camera) => {
  mat4_set_orthographic_projection(
    camera.proj,
    camera.width,
    camera.height,
    camera.near,
    camera.far,
    camera.webgpu,
    camera.left_hand,
  )
}
