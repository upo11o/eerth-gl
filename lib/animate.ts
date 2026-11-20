import { noop } from "./helpers"
import { clamp, floor, max, min } from "./math"


const next = requestAnimationFrame
const stop = cancelAnimationFrame

/** one way once animation. returns animation stopper */
export const wink = <T>(
  duration: number,
  ontick: (t: number, object: T) => void,
  onend: ((object: T) => void) | null = null,
  object = null as T,
): () => void => {

  onend ??= noop
  let start = -1
  let active = true

  const tick = (curr_time: number) => {
    if (start === -1) start = curr_time

    const t = min(1, (curr_time - start) / duration)
    ontick(t, object)

    if (active === false) return
    if (t < 1) id = next(tick)
    else onend(object)
  }

  let id = next(tick)

  return () => { active = false; stop(id) }
}


/** one way loop animation. returns animation stopper */
export const hoop = <T>(
  duration: number,
  ontick: (t: number, object: T) => void,
  onend: ((object: T) => void) | null = null,
  object = null as T,
): () => void => {

  onend ??= noop
  let start = -1
  let active = true

  const tick = (curr_time: number) => {
    if (start === -1) start = curr_time

    const time_ratio = (curr_time - start) / duration
    const t = min(1, time_ratio)
    ontick(t, object)

    if (t === 1) {
      onend(object)
      const cycles = floor(time_ratio)
      start += duration * cycles
    }

    if (active) id = next(tick)
  }

  let id = next(tick)

  return () => { active = false; stop(id) }
}


/** ping-pong way loop animation, returns animation stopper */
export const yoyo = <T>(
  duration: number,
  ontick: (t: number, object: T) => void,
  onstart: ((object: T) => void) | null = null,
  onend: ((object: T) => void) | null = null,
  object = null as T,
): () => void => {

  onend ??= noop
  onstart ??= noop
  let t = 0
  let start = -1
  let time_ratio = 0
  let active = true

  let pin = 0
  let dir = 1

  const switch_dir = () => {
    const cycles = floor(time_ratio)
    if (cycles % 2) {
      pin = t
      dir = -dir
    }
    start += duration * cycles
  }

  const tick = (curr_time: number) => {
    if (start === -1) start = curr_time

    time_ratio = (curr_time - start) / duration
    t = clamp(pin + dir * time_ratio, 0, 1)
    ontick(t, object)

    if (t === 0 && dir === -1) {
      switch_dir()
      onstart(object)
    }
    else if (t === 1 && dir === 1) {
      switch_dir()
      onend(object)
    }

    if (active) id = next(tick)
  }

  let id = next(tick)
  onstart(object)

  return () => { active = false; stop(id) }
}
