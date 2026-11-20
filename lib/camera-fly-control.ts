import { camera_update_mat, type Camera } from "./camera"
import { new_vec3 } from "./vec"
import { new_camera_orbit, type Camera_Orbit } from "./camera-orbit-control"
import { qweasd_clear_event, qweasd_down_event, qweasd_shift_event, qweasd_up_event } from "./ui/qweasd"



export type Camera_Fly = {
  /** current fly velocity vector */
  move:      Float32Array
  /** binded orbit control */
  orbit:     Camera_Orbit
  /** camera controled by the fly */
  camera:    Camera
  /** callback fired after orbit updates camera */
  on_update: () => void
}


export const new_camera_fly = (
  camera: Camera,
  el: HTMLElement,
  on_update: () => void,
): Camera_Fly => {

  const orbit = new_camera_orbit(camera, el, on_update)
  const move = new_vec3()
  const hand = camera.left_hand ? 1 : -1

  /** currently held key codes */
  const held = new Set<string>()
  let vel = 1

  const update_move = () => {
    move[0] = (+(held.has("KeyD") || held.has("ArrowRight")) - +(held.has("KeyA") || held.has("ArrowLeft"))) * vel
    move[1] = (+held.has("KeyE") - +held.has("KeyQ")) * vel
    move[2] = (+(held.has("KeyW") || held.has("ArrowUp")) - +(held.has("KeyS") || held.has("ArrowDown"))) * vel * hand
  }

  const update_vel = (force: boolean) => {
    vel = 1 + +force * 4
  }

  const clear_move = () => {
    held.clear()
    move.fill(0)
  }

  addEventListener("keydown", e => {
    // modifier shortcuts (cmd+s, ctrl+w, ...) must not move the camera,
    // also macOS drops keyup of keys released while cmd is held
    if (e.metaKey || e.ctrlKey || e.altKey) {
      clear_move()
      return
    }
    held.add(e.code)
    update_vel(e.shiftKey)
    update_move()
  })
  addEventListener("keyup", e => {
    held.delete(e.code)
    update_move()
  })
  addEventListener("blur", clear_move)

  // QWEASD UI listeners
  addEventListener(qweasd_down_event, (e: CustomEvent<string>) => {
    held.add(e.detail)
    update_move()
  })
  addEventListener(qweasd_up_event, (e: CustomEvent<string>) => {
    held.delete(e.detail)
    update_move()
  })
  addEventListener(qweasd_shift_event, (e: CustomEvent<boolean>) => {
    update_vel(e.detail)
    update_move()
  })
  addEventListener(qweasd_clear_event, clear_move)

  const fly: Camera_Fly = {
    move,
    orbit,
    camera,
    on_update,
  }

  return fly
}

export const update_camera_fly = (fly: Camera_Fly, dt: number) => {
  let camera_moved = false
  const camera = fly.camera
  const target = camera.target
  const mat = camera.mat
  const move = fly.move

  if (move[0]) {
    camera_moved = true
    const d = move[0] * dt
    target[0] += mat[0] * d
    target[1] += mat[1] * d
    target[2] += mat[2] * d
  }
  if (move[1]) {
    camera_moved = true
    const d = move[1] * dt
    target[0] += mat[4] * d
    target[1] += mat[5] * d
    target[2] += mat[6] * d
  }
  if (move[2]) {
    camera_moved = true
    const d = move[2] * dt
    target[0] += mat[8] * d
    target[1] += mat[9] * d
    target[2] += mat[10] * d
  }
  if (camera_moved) {
    const pos = camera.pos
    const translate = fly.orbit.cartesian
    pos[0] = target[0] + translate[0]
    pos[1] = target[1] + translate[1]
    pos[2] = target[2] + translate[2]
    camera_update_mat(camera)
    fly.on_update()
  }
}
