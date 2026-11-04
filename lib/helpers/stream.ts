import { noop } from "."
import { max } from "../math"


export type Reader = ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>

export type Stream = {
  reader: Reader
  data:   Uint8Array<ArrayBuffer>
  /** byte offset to remaining start */
  head:   number
  /** byte offset to remaining end */
  tail:   number
}


/** create Stream struct */
export const new_stream = (reader: Reader): Stream => ({
  reader,
  data: new Uint8Array(),
  head: 0,
  tail: 0,
})

/** get remaining data byte length */
export const stream_get_remaining_length = (stream: Stream): number => stream.tail - stream.head

/** upload loaded data */
export const stream_upload = async (stream: Stream): Promise<void> => {
  const { value, done } = await stream.reader.read()
  if (done) {
    throw "Unexpected end of stream"
  }

  const remaining = stream_get_remaining_length(stream)
  const new_size = remaining + value.length
  const stream_buf = stream.data

  if (stream.tail + value.length <= stream_buf.length) {
    // fits after tail, no need to shift
    stream_buf.set(value, stream.tail)
    stream.tail += value.length
  }
  else if (new_size <= stream_buf.length) {
    // fits after shifting, no need to reallocate
    stream_compact(stream)
    stream_buf.set(value, remaining)
    stream.tail = new_size
  }
  else {
    // geometrical grow, to avoid many reallocations
    const tmp = new Uint8Array(max(new_size, stream_buf.length * 2))
    tmp.set(stream_buf.subarray(stream.head, stream.tail), 0)
    tmp.set(value, remaining)
    stream.data = tmp
    stream.head = 0
    stream.tail = new_size
  }
}

/** copy remaining data to the buffer beginning, reset head/tail */
export const stream_compact = (stream: Stream): void => {
  stream.data.copyWithin(0, stream.head, stream.tail)
  stream.tail -= stream.head
  stream.head = 0
}

/** stop stream loading, free memory */
export const stream_dispose = (stream: Stream): void => {
  stream.reader.cancel().catch(noop)
  stream.data = null!
}

/** returns a u8 view of the MUTABLE buffer, not a copy. It doesn't check length against stream remaining */
export const stream_read_u8 = (stream: Stream, length: number): Uint8Array => {
  const buf = new Uint8Array(stream.data.buffer, stream.head, length)
  stream.head += length
  return buf
}

/** returns a f32 view of the MUTABLE buffer, not a copy. It doesn't check length against stream remaining */
export const stream_read_f32 = (stream: Stream, length: number): Float32Array => {
  const buf = new Float32Array(stream.data.buffer, stream.head, length)
  stream.head += length * 4
  return buf
}

/** returns a u32 view of the MUTABLE buffer, not a copy. It doesn't check length against stream remaining */
export const stream_read_u32 = (stream: Stream, length: number): Uint32Array => {
  const buf = new Uint32Array(stream.data.buffer, stream.head, length)
  stream.head += length * 4
  return buf
}
