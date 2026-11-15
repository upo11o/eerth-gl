import { min, mod } from "./math"

export type Uniform_Grid_3D<T> = {
  x: number
  y: number
  z: number

  width:  number
  height: number
  depth:  number

  length:    number
  x_length:  number
  y_length:  number
  z_length:  number
  xz_length: number

  cell_width:  number
  cell_height: number
  cell_depth:  number

  cells: Uniform_Grid_3D_Cell<T>[]
}

export type Uniform_Grid_3D_Cell<T> = {
  id: number
  ix: number
  iy: number
  iz: number

  x: number
  y: number
  z: number

  neighbors: Uniform_Grid_3D_Cell<T>[]
  store:     T[]
}


export const new_uniform_grid_3d = <T = any>(
  x: number,
  y: number,
  z: number,
  width:  number,
  height: number,
  depth:  number,
  x_length: number,
  y_length: number,
  z_length: number,
  wrap = false,
): Uniform_Grid_3D<T> => {

  const xz_length = x_length * z_length
  const length    = y_length * xz_length

  const cell_width  = width  / x_length
  const cell_height = height / y_length
  const cell_depth  = depth  / z_length

  // generate flat cells array: y -> z -> x

  const cells: Uniform_Grid_3D_Cell<T>[] = []

  for (let iy = 0; iy < y_length; iy++) {
    const idy = iy * xz_length
    for (let iz = 0; iz < z_length; iz++) {
      const idyz = idy + iz * x_length
      for (let ix = 0; ix < x_length; ix++) {
        const id = idyz + ix
        cells.push({
          id,
          ix,
          iy,
          iz,

          x: ix * cell_width  + x,
          y: iy * cell_height + y,
          z: iz * cell_depth  + z,

          neighbors: [],
          store:     [],
        })
      }
    }
  }

  const grid: Uniform_Grid_3D<T> = {
    x,
    y,
    z,
    width,
    height,
    depth,
    length,
    x_length,
    y_length,
    z_length,
    xz_length,
    cell_width,
    cell_height,
    cell_depth,
    cells,
  }

  // fill neighbors

  for (let i = 0; i < length; i++) {
    const cell = cells[i]
    const neib_set = new Set<Uniform_Grid_3D_Cell<T>>
    for (let iy = -1; iy < 2; iy++) {
      for (let iz = -1; iz < 2; iz++) {
        for (let ix = -1; ix < 2; ix++) {
          if (iy === 0 && ix === 0 && iz === 0) continue
          let neib_iy = cell.iy + iy
          let neib_iz = cell.iz + iz
          let neib_ix = cell.ix + ix
          if (wrap) {
            neib_iy = mod(cell.iy + iy, y_length)
            neib_iz = mod(cell.iz + iz, z_length)
            neib_ix = mod(cell.ix + ix, x_length)
          }
          else if (
            neib_iy < 0 ||
            neib_iz < 0 ||
            neib_ix < 0 ||
            neib_iy > y_length - 1 ||
            neib_iz > z_length - 1 ||
            neib_ix > x_length - 1
          ) {
            continue
          }
          const neib_id = neib_iy * xz_length + neib_iz * x_length + neib_ix
          if (neib_id !== cell.id) {
            neib_set.add(cells[neib_id])
          }
        }
      }
    }
    cell.neighbors = Array.from(neib_set).sort((a, b) => a.id - b.id)
  }

  return grid
}


export const grid_3d_get_cell = <T>(
  grid: Uniform_Grid_3D<T>,
  x: number,
  y: number,
  z: number,
): Uniform_Grid_3D_Cell<T> | null => {
  if (
    x < grid.x ||
    y < grid.y ||
    z < grid.z ||
    x > grid.width  + grid.x ||
    y > grid.height + grid.y ||
    z > grid.depth  + grid.z
  ) {
    return null
  }
  const ix = min(grid.x_length - 1, (x - grid.x) / grid.cell_width  | 0)
  const iy = min(grid.y_length - 1, (y - grid.y) / grid.cell_height | 0)
  const iz = min(grid.z_length - 1, (z - grid.z) / grid.cell_depth  | 0)
  const id = iy * grid.xz_length + iz * grid.x_length + ix
  return grid.cells[id]
}

export const grid_3d_insert = <T>(cell: Uniform_Grid_3D_Cell<T>, entity: T): void => {
  cell.store.push(entity)
}

export const grid_3d_remove = <T>(cell: Uniform_Grid_3D_Cell<T>, entity: T): void => {
  const store = cell.store
  const idx = store.indexOf(entity)
  idx > -1 && store.splice(idx, 1)
}
