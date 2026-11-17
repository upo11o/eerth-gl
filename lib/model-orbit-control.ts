import { mat4_rot_gx, mat4_rot_ly } from "./mat4"
import { clamp, IOTA } from "./math"


export const new_model_orbit = (
  model: NumberArray,
  el: HTMLElement,
  on_update: () => void,
): void => {
  let px = 0, py = 0, pid = -1
  let polar_angle = 0

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
    const dx = (e.clientX - px) * 0.005
    const dy = (e.clientY - py) * 0.005
    px = e.clientX
    py = e.clientY

    mat4_rot_ly(model, -dx)
    const prev_polar = polar_angle
    polar_angle = clamp(polar_angle - dy, -IOTA, IOTA)
    mat4_rot_gx(model, polar_angle - prev_polar)

    on_update()
  })
}
