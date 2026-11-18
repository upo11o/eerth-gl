import { acos, ceil, cos, random, sin, SQRT3, TAU } from "./math"

type Point_3D = [number, number, number]

export const poisson_disk_3d = (size: number, r: number, k = 30) => {
  const r_sq = r * r
  const cell_size = r / SQRT3
  const cols = ceil(size / cell_size)
  const cols_sq = cols * cols
  const grid = new Map<number, Point_3D>()
  const key = (i: number, j: number, k: number) => i + cols * j + cols_sq * k

  const points: Point_3D[] = []
  const active: Point_3D[] = []

  const add = (p: Point_3D) => {
    points.push(p)
    active.push(p)
    grid.set(key(...p.map(x => x / cell_size | 0) as Point_3D), p)
  }

  add(Array(3).fill(0).map(() => random() * size) as Point_3D)

  while (active.length > 0) {
    const idx = random() * active.length | 0
    const [ ax, ay, az ] = active[idx]
    let found = false

    for (let n = 0; n < k; n++) {
      // Random point in spherical annulus [r, 2r]
      const theta = random() * TAU
      const phi = acos(1 - 2 * random())
      const sin_phi = sin(phi)
      const dist = r + random() * r
      const cx = ax + dist * sin_phi * cos(theta)
      const cy = ay + dist * sin_phi * sin(theta)
      const cz = az + dist * cos(phi)

      if (cx < 0 || cy < 0 || cz < 0 || cx >= size || cy >= size || cz >= size) continue

      const gi = cx / cell_size | 0
      const gj = cy / cell_size | 0
      const gk = cz / cell_size | 0

      let ok = true
      for (let di = -2; di <= 2 && ok; di++) {
        for (let dj = -2; dj <= 2 && ok; dj++) {
          for (let dk = -2; dk <= 2 && ok; dk++) {
            const neighbor = grid.get(key(gi + di, gj + dj, gk + dk))
            if (neighbor === undefined) continue

            const dx = cx - neighbor[0]
            const dy = cy - neighbor[1]
            const dz = cz - neighbor[2]
            ok = dx * dx + dy * dy + dz * dz >= r_sq
          }
        }
      }

      if (ok) {
        add([ cx, cy, cz ])
        found = true
        break
      }
    }

    if (!found) {
      active.splice(idx, 1)
    }
  }

  return points
}
