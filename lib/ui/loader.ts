import { hoop } from "eerth-gl/animate"
import { h } from "./h"
import { IOTA, TAU } from "eerth-gl/math"


export const new_loader = (
  label: string,
  freq: number,
  container = document.body,
  style = "",
) => {
  const size = 64
  const center = size >> 1
  const radius = center - 2

  const loader = h("div", { style: "width:fit-content;display:flex;flex-direction:column;justify-content: center;align-items:center;gap:16px;" + style })
  const text = h("label", null, label)
  const canvas = h("canvas", { style: `width:${size}px;height:${size}px` })
  canvas.width = canvas.height = size
  const ctx = canvas.getContext("2d")!
  ctx.strokeStyle = "#fff"
  ctx.lineCap = "round"
  ctx.lineWidth = 4

  const angle_start = IOTA * 0.5
  const angle_end = angle_start + IOTA

  const stop = hoop(freq, t => {
    ctx.clearRect(0, 0, size, size)
    ctx.beginPath()
    t *= TAU
    ctx.arc(center, center, radius, (angle_start + t) % TAU, (angle_end + t) % TAU)
    ctx.stroke()
  })

  loader.append(canvas, text)
  container.appendChild(loader)

  return () => {
    stop()
    loader.remove()
  }
}
