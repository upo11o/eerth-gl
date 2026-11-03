import { min } from "../math"
import { buf_starts_with, find_in_buf, new_stream, new_worker, noop, stream_compact, stream_dispose, stream_get_remaining_length, stream_read_f32, stream_read_u8, stream_upload, type Stream } from "../helpers"
import { parser_worker, type Ply_Parser_Input_Data, type Ply_Parser_Input_Header, type Ply_Parser_Output } from "./gs-parser"


export type Ply_Property = {
  name: string
  type: keyof typeof Typed_Array_Fabric
  /** bytes of its property type */
  size: number
}

export type Ply_Element = {
  name:  string // 'vertex', etc
  count: number
  props: Ply_Property[]
  bytes: number
}

export type Ply_Header = {
  comments: string[]
  elements: Ply_Element[]
  format:   string // 'binary_little_endian' | 'binary_big_endian' | 'ascii'
}


export const load_ply = async (
  url: string,
  on_header: (header: Ply_Header, count: number) => void,
  on_data: (data: Ply_Parser_Output) => void,
  on_vertex_done: () => void = noop,
) => {
  let stream: Stream | undefined
  let worker: Worker | undefined

  const terminate_worker = () => {
    worker?.terminate()
    worker = undefined
  }

  try {
    const res = await fetch(url)
    if (!res.ok || !res.body) {
      throw `no data found on ${url}`
    }
    stream = new_stream(res.body.getReader())

    //// read header
    const header = await read_header(stream)

    if (header.format !== "binary_little_endian") {
      throw `format '${header.format}' is not supported`
    }

    //// validate vertex header
    const vertex_header = header.elements.find(e => e.name === "vertex")
    if (!vertex_header) {
      throw "No vertex header"
    }
    validate_vertex_header(vertex_header)
    on_header(header, vertex_header.count)

    //// prepare vertex parser worker
    worker = new_worker(`(${parser_worker})()`)

    const header_message: Ply_Parser_Input_Header = { type: "header", ...vertex_header }
    worker.postMessage(header_message)

    worker.onmessage = (e: MessageEvent<Ply_Parser_Output>) => {
      on_data(e.data)
      if (e.data.offset + e.data.count === vertex_header.count) {
        terminate_worker()
        on_vertex_done()
      }
    }

    //// read vertex data
    await read_vertex_data(stream, vertex_header, (data, offset, count) => {
      const data_message: Ply_Parser_Input_Data = { type: "data", data, count, offset }
      worker?.postMessage(data_message, [ data.buffer ])
    })
  }
  catch (e) {
    console.error(e)
    terminate_worker()
  }
  finally {
    stream && stream_dispose(stream)
  }
}


//////// HEADER
///////

const read_header = async (stream: Stream): Promise<Ply_Header> => {
  let header_length: number

  while (true) {
    await stream_upload(stream)
    if (stream.tail >= START_HEADER.length && !buf_starts_with(stream.data, START_HEADER)) {
      throw new Error("Invalid ply header")
    }

    header_length = find_in_buf(stream.data.subarray(0, stream.tail), END_HEADER)
    if (header_length !== -1) {
      header_length += END_HEADER.length
      break
    }
  }

  const lines = ascii_decoder.decode(stream_read_u8(stream, header_length)).trim().split("\n")
  stream_compact(stream)

  const elements: Ply_Element[] = []
  const comments: string[] = []
  let format = ""
  let current_element: Ply_Element | null = null

  for (let i = 0; i < lines.length; ++i) {
    const words = lines[i].split(" ").filter(Boolean)

    switch (words[0]) {
      case "ply":
      case "end_header":
        break
      case "comment":
        comments.push(lines[i].substring(8))
        break
      case "format":
        format = words[1]
        break
      case "element":
        if (words.length !== 3) {
          throw new Error(`invalid element line '${lines[i]}' in ply header`)
        }
        elements.push(current_element = {
          name:  words[1],
          count: parseInt(words[2], 10),
          bytes: 0,
          props: [],
        })
        break
      case "property": {
        if (!current_element || words.length !== 3 || words[1] in Typed_Array_Fabric === false) {
          throw new Error(`invalid property line '${lines[i]}' in ply header`)
        }
        const prop: Ply_Property = {
          type: words[1] as Ply_Property["type"],
          name: words[2],
          size: Typed_Array_Fabric[words[1] as Ply_Property["type"]].BYTES_PER_ELEMENT,
        }
        current_element.props.push(prop)
        current_element.bytes += prop.size
        break
      }
      default:
        throw new Error(`Unrecognized ply header line '${words[0]}'`)
    }
  }

  for (const el of elements) {
    el.bytes *= el.count
  }

  return { comments, elements, format }
}


//////// VERTEX
///////

const read_vertex_data = async (
  stream: Stream,
  vertex_header: Ply_Element,
  on_data: (data: Float32Array, offset: number, count: number) => void,
): Promise<void> => {

  const props = vertex_header.props
  const count = vertex_header.count
  const vertex_length = props.length
  const vertex_byte_length = vertex_length << 2
  let cursor = 0

  while (cursor < count) {
    const remaining = stream_get_remaining_length(stream)
    if (remaining < vertex_byte_length) {
      await stream_upload(stream)
      continue
    }

    const vertices_to_read = min(remaining / vertex_byte_length | 0, count - cursor)
    const data = stream_read_f32(stream, vertices_to_read * vertex_length).slice()
    stream_compact(stream)
    on_data(data, cursor, vertices_to_read)

    cursor += vertices_to_read
  }
}


//////// HELPERS
///////

const ascii_decoder = new TextDecoder("ascii")

/** ply\n */
const START_HEADER = new Uint8Array([ 112, 108, 121, 10 ])
/** \nend_header\n */
const END_HEADER = new Uint8Array([ 10, 101, 110, 100, 95, 104, 101, 97, 100, 101, 114, 10 ])


const Typed_Array_Fabric = {
  char:   Int8Array,
  uchar:  Uint8Array,
  short:  Int16Array,
  ushort: Uint16Array,
  int:    Int32Array,
  uint:   Uint32Array,
  float:  Float32Array,
  double: Float64Array,
} as const


const required_props = [
  "x", "y", "z",
  "scale_0", "scale_1", "scale_2",
  "rot_0", "rot_1", "rot_2", "rot_3",
  "f_dc_0", "f_dc_1", "f_dc_2", "opacity",
] as const


const validate_vertex_header = (header: Ply_Element): void => {
  const props_to_check = required_props.slice()

  for (let i = 0; i < header.props.length; i++) {
    if (props_to_check.length === 0) {
      const invalid_prop_names = header.props.slice(i).map(p => p.name).join(", ")
      throw "Invalid vertex header: " + invalid_prop_names + " props aren't supported"
    }
    const prop = header.props[i]
    const id = props_to_check.indexOf(prop.name)
    if (id !== -1 && prop.type === "float") {
      props_to_check.splice(id, 1)
    }
  }

  if (props_to_check.length) {
    throw "Invalid vertex header: " + props_to_check.join(", ") + " props are required"
  }
}
