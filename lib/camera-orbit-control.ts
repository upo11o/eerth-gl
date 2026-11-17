import { noop } from "./helpers"
import { camera_update_mat, type Camera } from "./camera"
import { clamp, exp, IOTA, PI, TAU } from "./math"
import { spherical_get_pos, spherical_set_from_pos } from "./spherical"
import { new_vec3, vec3_set } from "./vec"



type Camera_Orbit = {
  spherical:  Float32Array
  cartesian:  Float32Array
  camera:     Camera
  min_polar:  number
  max_polar:  number
  min_radius: number
  max_radius: number
  on_update:  () => void
}


export const new_camera_orbit = (
  camera: Camera,
  el: HTMLElement,
  on_update = noop<void>,
  min_polar = 0.1,
  max_polar = PI - 0.1,
  min_radius = 0.1,
  max_radius = 10,
): Camera_Orbit => {

  let px = 0, py = 0, pid = -1
  el.style.touchAction = "none"

  const spherical = new_vec3()
  const cartesian = new_vec3()

  const release = (e: PointerEvent) => { if (e.pointerId === pid) pid = -1 }
  el.addEventListener("pointerup", release)
  el.addEventListener("pointercancel", release)

  el.addEventListener("pointerdown", e => {
    if (e.button !== 0 || !e.isPrimary) return
    el.setPointerCapture(pid = e.pointerId)
    px = e.clientX
    py = e.clientY
  })

  el.addEventListener("pointermove", e => {
    if (e.pointerId !== pid) return
    const dx = (e.clientX - px) * 0.003
    const dy = (e.clientY - py) * 0.003
    camera_orbit_update(orbit, -dx, dy)
    px = e.clientX
    py = e.clientY
  })

  el.addEventListener("wheel", (e) => {
    e.preventDefault()
    const mode = e.deltaMode
    const dy = e.deltaY * (mode === 1 ? 16 : mode === 2 ? 100 : 1)
    spherical[2] *= exp(dy * 0.001)
    // spherical[2] += dy * 0.01
    spherical[2] = clamp(spherical[2], orbit.min_radius, orbit.max_radius)
    transform_camera(orbit)
    orbit.on_update()
  }, { passive: false })

  const p = camera.pos
  const t = camera.target
  vec3_set(cartesian, p[0] - t[0], p[1] - t[1], p[2] - t[2])

  spherical_set_from_pos(spherical, cartesian)

  if (spherical[2] === 0) {
    console.warn("camera position === camera target")
    spherical[0] = IOTA
  }
  spherical[0] = clamp(spherical[0], min_polar,  max_polar)
  spherical[2] = clamp(spherical[2], min_radius, max_radius)

  const orbit: Camera_Orbit = {
    spherical,
    cartesian,
    camera,
    min_polar,
    max_polar,
    min_radius,
    max_radius,
    on_update,
  }

  transform_camera(orbit)

  return orbit
}


export const camera_orbit_update = (orbit: Camera_Orbit, dx: number, dy: number): void => {
  const spherical = orbit.spherical
  spherical[0] -= dy
  spherical[0]  = clamp(spherical[0], orbit.min_polar, orbit.max_polar)
  spherical[1] -= dx
  spherical[1] %= TAU
  transform_camera(orbit)
  orbit.on_update()
}


const transform_camera = (orbit: Camera_Orbit): void => {
  const translate = orbit.cartesian
  const camera    = orbit.camera
  const pos       = camera.pos
  const target    = camera.target
  spherical_get_pos(orbit.spherical, translate)
  pos[0] = target[0] + translate[0]
  pos[1] = target[1] + translate[1]
  pos[2] = target[2] + translate[2]
  camera_update_mat(camera)
}
