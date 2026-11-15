import { min, mod } from "./math"


export type Uniform_Grid_2D<T = any> = {
  x: number
  y: number

  width:       number
  height:      number
  cell_width:  number
  cell_height: number

  x_length: number
  y_length: number
  length:   number

  cells: Uniform_Grid_2D_Cell<T>[]
}

export type Uniform_Grid_2D_Cell<T = any> = {
  id: number
  ix: number
  iy: number

  x: number
  y: number

  neighbors: Uniform_Grid_2D_Cell<T>[]
  store:     T[]
}


export const new_uniform_grid_2d = <T = any>(
  x: number,
  y: number,
  width:  number,
  height: number,
  x_length: number,
  y_length: number,
  wrap = false,
): Uniform_Grid_2D<T> => {

  const length    = y_length * x_length

  const cell_width  = width  / x_length
  const cell_height = height / y_length

  // generate flat cells array: y -> x

  const cells: Uniform_Grid_2D_Cell[] = []

  for (let iy = 0; iy < y_length; iy++) {
    const idy = iy * x_length
    for (let ix = 0; ix < x_length; ix++) {
      const id = idy + ix
      cells.push({
        id,
        ix,
        iy,

        x: ix * cell_width  + x,
        y: iy * cell_height + y,

        neighbors: [],
        store:     [],
      })
    }
  }

  const grid: Uniform_Grid_2D<T> = {
    x,
    y,
    width,
    height,
    cell_width,
    cell_height,
    x_length,
    y_length,
    length,
    cells,
  }

  // fill neighbors

  for (let i = 0; i < length; i++) {
    const cell = cells[i]
    const neib_set = new Set<Uniform_Grid_2D_Cell<T>>
    for (let iy = -1; iy < 2; iy++) {
      for (let ix = -1; ix < 2; ix++) {
        if (iy === 0 && ix === 0) continue
        let neib_iy = cell.iy + iy
        let neib_ix = cell.ix + ix
        if (wrap) {
          neib_iy = mod(cell.iy + iy, y_length)
          neib_ix = mod(cell.ix + ix, x_length)
        }
        else if (
          neib_iy < 0 ||
          neib_ix < 0 ||
          neib_iy > y_length - 1 ||
          neib_ix > x_length - 1
        ) {
          continue
        }
        const neib_id = neib_iy * x_length + neib_ix
        if (neib_id !== cell.id) {
          neib_set.add(cells[neib_id])
        }
      }
    }
    cell.neighbors = Array.from(neib_set).sort((a, b) => a.id - b.id)
  }

  return grid
}

export const grid_2d_get_cell = <T>(
  grid: Uniform_Grid_2D<T>,
  x: number,
  y: number,
): Uniform_Grid_2D_Cell<T> | null => {
  if (
    x < grid.x ||
    y < grid.y ||
    x > grid.width  + grid.x ||
    y > grid.height + grid.y
  ) {
    return null
  }
  const ix = min(grid.x_length - 1, (x - grid.x) / grid.cell_width  | 0)
  const iy = min(grid.y_length - 1, (y - grid.y) / grid.cell_height | 0)
  const id = iy * grid.x_length + ix
  return grid.cells[id]
}

export const grid_2d_insert = <T>(cell: Uniform_Grid_2D_Cell<T>, entity: T): void => {
  cell.store.push(entity)
}

export const grid_2d_remove = <T>(cell: Uniform_Grid_2D_Cell<T>, entity: T): void => {
  const store = cell.store
  const idx = store.indexOf(entity)
  idx > -1 && store.splice(idx, 1)
}
