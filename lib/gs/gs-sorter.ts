declare const postMessage: Worker["postMessage"]

export type Ply_Sorter_Output = {
  /** ids of splats in front of the camera plane, ordered back to front */
  order: Uint32Array
  /** number of splats in order */
  count: number
}

export type Ply_Sorter_Input_Header = {
  type:  "header"
  count: number
}

export type Ply_Sorter_Input_Data = {
  type:     "data"
  /** xyzw per splat, same layout as Ply_Parser_Output.position */
  position: Float32Array
  offset:   number
  count:    number
}

export type Ply_Sorter_Input_Camera = {
  type:       "camera"
  /** model-view matrix (view * model), splat positions are in model space */
  model_view: Float32Array
  proj:       Float32Array
}


export function sorter_worker() {

  // 16-bit depth quantization for the counting sort
  const BUCKETS = 1 << 16
  // relative change of the depth equation that triggers a resort
  const RESORT_EPSILON = 1e-4

  let vertex_count = 0
  let loaded = 0
  let sorted = 0

  let positions: Float32Array
  let depths:    Float32Array
  let keys:      Uint16Array
  let ids:       Uint32Array
  const counts = new Uint32Array(BUCKETS)

  // depth = row · (x, y, z, 1), a row of proj * view
  const row      = new Float64Array(4)
  const last_row = new Float64Array(4)
  // depth of the camera plane, splats with depth <= plane are behind the camera
  let plane = 0
  let has_camera = false
  let scheduled  = false


  onmessage = (e: MessageEvent<Ply_Sorter_Input_Header | Ply_Sorter_Input_Data | Ply_Sorter_Input_Camera>) => {
    const msg = e.data

    if (msg?.type === "header") {
      vertex_count = msg.count
      loaded = sorted = 0
      positions = new Float32Array(vertex_count * 4)
      depths    = new Float32Array(vertex_count)
      keys      = new Uint16Array(vertex_count)
      ids       = new Uint32Array(vertex_count)
      return
    }

    if (msg?.type === "data") {
      positions.set(msg.position.subarray(0, msg.count * 4), msg.offset * 4)
      loaded = Math.max(loaded, msg.offset + msg.count)
      schedule_sort()
      return
    }

    if (msg?.type === "camera") {
      set_depth_row(msg.model_view, msg.proj)
      has_camera = true
      schedule_sort()
    }
  }

  /**
   * Picks the clip-space row that grows with distance from the camera:
   * w for perspective projection (w = -z_view), z for orthographic one.
   * Column-major: (P * V)[r][j] = Σk P[r + 4k] * V[k + 4j]
   * The camera plane is z_view = 0, its depth is P * (0, 0, 0, 1) = P[12 + r]
   */
  const set_depth_row = (view: Float32Array, proj: Float32Array) => {
    const r = proj[15] === 0 ? 3 : 2
    plane = proj[12 + r]
    for (let j = 0; j < 4; j++) {
      row[j] =
        proj[r]      * view[4 * j]     +
        proj[r + 4]  * view[4 * j + 1] +
        proj[r + 8]  * view[4 * j + 2] +
        proj[r + 12] * view[4 * j + 3]
    }
  }

  const row_changed = (): boolean => {
    let diff = 0, len = 0
    for (let j = 0; j < 4; j++) {
      diff += Math.abs(row[j] - last_row[j])
      len  += Math.abs(row[j])
    }
    return diff > len * RESORT_EPSILON
  }

  // coalesce bursts of camera/data messages into a single sort
  const schedule_sort = () => {
    if (scheduled) return
    scheduled = true
    setTimeout(sort, 0)
  }

  const sort = () => {
    scheduled = false
    if (!has_camera || loaded === 0) return
    if (loaded === sorted && !row_changed()) return

    last_row.set(row)
    sorted = loaded

    const a = row[0], b = row[1], c = row[2], d = row[3]

    let min_depth = Infinity
    let max_depth = -Infinity
    let n = 0

    // keep only splats in front of the camera plane
    for (let i = 0; i < loaded; i++) {
      const i4 = i << 2
      const depth = a * positions[i4] + b * positions[i4 + 1] + c * positions[i4 + 2] + d
      if (depth <= plane) continue
      ids[n] = i
      depths[n] = depth
      n++
      if (depth < min_depth) min_depth = depth
      if (depth > max_depth) max_depth = depth
    }

    // farthest splat gets key 0, so it is drawn first (back to front for blending)
    const range = max_depth - min_depth
    const scale = range > 0 ? (BUCKETS - 1) / range : 0

    counts.fill(0)
    for (let i = 0; i < n; i++) {
      const key = (max_depth - depths[i]) * scale | 0
      keys[i] = key
      counts[key]++
    }

    // exclusive prefix sum -> bucket start offsets
    let sum = 0
    for (let k = 0; k < BUCKETS; k++) {
      const count = counts[k]
      counts[k] = sum
      sum += count
    }

    const order = new Uint32Array(n)
    for (let i = 0; i < n; i++) {
      order[counts[keys[i]]++] = ids[i]
    }

    const output: Ply_Sorter_Output = { order, count: n }
    postMessage(output, [ order.buffer ])
  }
}
