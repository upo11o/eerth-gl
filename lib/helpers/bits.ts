const norm_u8 = 1 / 255

/** u8 array -> f16 array. if normalized converts (0-255 -> 0-1) */
export const u8_to_f16 = (data: Uint8Array | Uint8ClampedArray, normalize = true): Uint16Array => {
  const out = new Float16Array(data.length)
  if (normalize) for (let i = 0; i < data.length; i++) out[i] = data[i] * norm_u8
  else out.set(data)
  return new Uint16Array(out.buffer)
}


/** u8 array -> f32 array. if normalized converts (0-255 -> 0-1) */
export const u8_to_f32 = (data: Uint8Array | Uint8ClampedArray, normalize = true): Float32Array => {
  const out = new Float32Array(data.length)
  if (normalize) for (let i = 0; i < data.length; i++) {
    out[i] = data[i] * norm_u8
  }
  else out.set(data)
  return out
}


export const buf_starts_with = (buf: Uint8Array, search: Uint8Array) => {
  if (buf.length < search.length)
    return false

  for (let i = 0; i < search.length; ++i)
    if (buf[i] !== search[i])
      return false

  return true
}


export const find_in_buf = (buf: Uint8Array, search: Uint8Array) => {
  const end = buf.length - search.length
  buf_loop:
  for (let i = 0; i <= end; ++i) {
    for (let j = 0; j < search.length; ++j) {
      if (buf[i + j] !== search[j]) {
        continue buf_loop
      }
    }
    return i
  }
  return -1
}
