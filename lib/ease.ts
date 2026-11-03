import { cos, PI, sin, sqrt } from "./math"


// 3 * t ** 2 - 2 * t ** 3
export const smooth = (t: number) => t * t * (3 - 2 * t)
// 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3
export const smoother = (t: number) => t * t * t * (10 + t * (6 * t - 15))
// 35 * t ** 4 - 84 * t ** 5 + 70 * t ** 6 - 20 * t ** 7
export const smoothest = (t: number) => t * t * t * t * (35 - t * (84 - t * (70 - 20 * t)))

export const sinein    = (t: number) => 1 - cos(t * PI * 0.5)
export const sineout   = (t: number) => sin(t * PI * 0.5)
export const sineinout = (t: number) => (1 - cos(PI * t)) * 0.5

export const quadin    = (t: number) => t * t
export const quadout   = (t: number) => 1 - (1 - t) * (1 - t)
export const quadinout = (t: number) => t < 0.5 ? 2 * t * t : t * (4 - 2 * t) - 1

export const cubicin    = (t: number) => t * t * t
export const cubicout   = (t: number) => --t * t * t + 1
export const cubicinout = (t: number) => t < 0.5 ? 4 * t * t * t : t * (t * (4 * t - 12) + 12) - 3

export const circin    = (t: number) => 1 - sqrt(1 - t * t)
export const circout   = (t: number) => sqrt(1 - (t - 1) * (t - 1))
export const circinout = (t: number) => (t < 0.5 ? 1 - sqrt(1 - 4 * t * t) : sqrt(1 - (1 - t) * (1 - t) * 4) + 1) * 0.5
