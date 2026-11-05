import { fract } from "./math"


const enum GL {
  FLOAT = 5126,
  FLOAT_VEC2 = 35664,
  FLOAT_VEC3 = 35665,
  FLOAT_VEC4 = 35666,
  FLOAT_MAT2 = 35674,
  FLOAT_MAT3 = 35675,
  FLOAT_MAT4 = 35676,
  FLOAT_MAT2x3 = 35685,
  FLOAT_MAT2x4 = 35686,
  FLOAT_MAT3x2 = 35687,
  FLOAT_MAT3x4 = 35688,
  FLOAT_MAT4x2 = 35689,
  FLOAT_MAT4x3 = 35690,
  HALF_FLOAT = 5131,
  INT = 5124,
  INT_VEC2 = 35667,
  INT_VEC3 = 35668,
  INT_VEC4 = 35669,
  UNSIGNED_INT = 5125,
  UNSIGNED_INT_VEC2 = 36294,
  UNSIGNED_INT_VEC3 = 36295,
  UNSIGNED_INT_VEC4 = 36296,
  BYTE = 5120,
  UNSIGNED_BYTE = 5121,
  SHORT = 5122,
  UNSIGNED_SHORT = 5123,

  RGBA32F = 34836,
  RGB32F = 34837,
  RG32F = 33328,
  R32F = 33326,

  RGBA16F = 34842,
  RGB16F = 34843,
  RG16F = 33327,
  R16F = 33325,

  RGBA8 = 32856,
  RGB8 = 32849,
  RG8 = 33323,
  R8 = 33321,

  R8I = 33329,
  R8UI = 33330,
  R16I = 33331,
  R16UI = 33332,
  R32I = 33333,
  R32UI = 33334,

  RGBA = 6408,
  RGB = 6407,
  RG = 33319,
  RED = 6403,
  RED_INTEGER = 36244,

  NEAREST = 9728,
  LINEAR = 9729,
  NEAREST_MIPMAP_NEAREST = 9984,
  LINEAR_MIPMAP_NEAREST = 9985,
  NEAREST_MIPMAP_LINEAR = 9986,
  LINEAR_MIPMAP_LINEAR = 9987,

  REPEAT = 10497,
  CLAMP_TO_EDGE = 33071,
  MIRRORED_REPEAT = 33648,

  STREAM_DRAW = 35040,
  STREAM_READ = 35041,
  STREAM_COPY = 35042,
  STATIC_DRAW = 35044,
  STATIC_READ = 35045,
  STATIC_COPY = 35046,
  DYNAMIC_DRAW = 35048,
  DYNAMIC_READ = 35049,
  DYNAMIC_COPY = 35050,
}


type Attribute_Format =
| GL.FLOAT
| GL.FLOAT_VEC2
| GL.FLOAT_VEC3
| GL.FLOAT_VEC4
| GL.FLOAT_MAT2
| GL.FLOAT_MAT3
| GL.FLOAT_MAT4
| GL.FLOAT_MAT2x3
| GL.FLOAT_MAT2x4
| GL.FLOAT_MAT3x2
| GL.FLOAT_MAT3x4
| GL.FLOAT_MAT4x2
| GL.FLOAT_MAT4x3
| GL.INT
| GL.INT_VEC2
| GL.INT_VEC3
| GL.INT_VEC4
| GL.UNSIGNED_INT
| GL.UNSIGNED_INT_VEC2
| GL.UNSIGNED_INT_VEC3
| GL.UNSIGNED_INT_VEC4


const attribute_size_map: Record<Attribute_Format, number> = {
  [GL.FLOAT]:      1,
  [GL.FLOAT_VEC2]: 2,
  [GL.FLOAT_VEC3]: 3,
  [GL.FLOAT_VEC4]: 4,
  [GL.FLOAT_MAT2]: 2,
  [GL.FLOAT_MAT3]: 3,
  [GL.FLOAT_MAT4]: 4,

  [GL.FLOAT_MAT2x3]: 3,
  [GL.FLOAT_MAT2x4]: 4,
  [GL.FLOAT_MAT3x2]: 2,
  [GL.FLOAT_MAT3x4]: 4,
  [GL.FLOAT_MAT4x2]: 2,
  [GL.FLOAT_MAT4x3]: 3,

  [GL.INT]:      1,
  [GL.INT_VEC2]: 2,
  [GL.INT_VEC3]: 3,
  [GL.INT_VEC4]: 4,

  [GL.UNSIGNED_INT]:      1,
  [GL.UNSIGNED_INT_VEC2]: 2,
  [GL.UNSIGNED_INT_VEC3]: 3,
  [GL.UNSIGNED_INT_VEC4]: 4,
}


const attribute_bytes_map: Record<Attribute_Format, number> = {
  [GL.FLOAT]:      4,
  [GL.FLOAT_VEC2]: 8,
  [GL.FLOAT_VEC3]: 12,
  [GL.FLOAT_VEC4]: 16,
  [GL.FLOAT_MAT2]: 16,
  [GL.FLOAT_MAT3]: 36,
  [GL.FLOAT_MAT4]: 64,

  [GL.FLOAT_MAT2x3]: 24,
  [GL.FLOAT_MAT2x4]: 32,
  [GL.FLOAT_MAT3x2]: 24,
  [GL.FLOAT_MAT3x4]: 48,
  [GL.FLOAT_MAT4x2]: 32,
  [GL.FLOAT_MAT4x3]: 48,

  [GL.INT]:      4,
  [GL.INT_VEC2]: 8,
  [GL.INT_VEC3]: 12,
  [GL.INT_VEC4]: 16,

  [GL.UNSIGNED_INT]:      4,
  [GL.UNSIGNED_INT_VEC2]: 8,
  [GL.UNSIGNED_INT_VEC3]: 12,
  [GL.UNSIGNED_INT_VEC4]: 16,
}


const attribute_type_map: Record<Attribute_Format, number> = {
  [GL.FLOAT]:        GL.FLOAT,
  [GL.FLOAT_VEC2]:   GL.FLOAT,
  [GL.FLOAT_VEC3]:   GL.FLOAT,
  [GL.FLOAT_VEC4]:   GL.FLOAT,
  [GL.FLOAT_MAT2]:   GL.FLOAT,
  [GL.FLOAT_MAT3]:   GL.FLOAT,
  [GL.FLOAT_MAT4]:   GL.FLOAT,
  [GL.FLOAT_MAT2x3]: GL.FLOAT,
  [GL.FLOAT_MAT2x4]: GL.FLOAT,
  [GL.FLOAT_MAT3x2]: GL.FLOAT,
  [GL.FLOAT_MAT3x4]: GL.FLOAT,
  [GL.FLOAT_MAT4x2]: GL.FLOAT,
  [GL.FLOAT_MAT4x3]: GL.FLOAT,

  [GL.INT]:      GL.INT,
  [GL.INT_VEC2]: GL.INT,
  [GL.INT_VEC3]: GL.INT,
  [GL.INT_VEC4]: GL.INT,

  [GL.UNSIGNED_INT]:      GL.UNSIGNED_INT,
  [GL.UNSIGNED_INT_VEC2]: GL.UNSIGNED_INT,
  [GL.UNSIGNED_INT_VEC3]: GL.UNSIGNED_INT,
  [GL.UNSIGNED_INT_VEC4]: GL.UNSIGNED_INT,
}


type Attribute_Mat =
| GL.FLOAT_MAT2
| GL.FLOAT_MAT3
| GL.FLOAT_MAT4
| GL.FLOAT_MAT2x3
| GL.FLOAT_MAT2x4
| GL.FLOAT_MAT3x2
| GL.FLOAT_MAT3x4
| GL.FLOAT_MAT4x2
| GL.FLOAT_MAT4x3


const attribute_mat_columns_map: Record<Attribute_Mat, number> = {
  [GL.FLOAT_MAT2]:   2,
  [GL.FLOAT_MAT3]:   3,
  [GL.FLOAT_MAT4]:   4,
  [GL.FLOAT_MAT2x3]: 2,
  [GL.FLOAT_MAT2x4]: 2,
  [GL.FLOAT_MAT3x2]: 3,
  [GL.FLOAT_MAT3x4]: 3,
  [GL.FLOAT_MAT4x2]: 4,
  [GL.FLOAT_MAT4x3]: 4,
}


export type Attribute_Pointer = {
  id:     number
  name:   string
  format: Attribute_Format
  type:   number
  size:   number
  bytes:  number
}


export type Binded_Attribute_Pointer = Attribute_Pointer & {
  offset: number
}


export type Material<A extends string = string, U extends string = string> = {
  id:         WebGLProgram
  attributes: Record<A, Attribute_Pointer>
  uniforms:   Record<U, WebGLUniformLocation>
  vert:       string
  frag:       string
}


export const new_material = <A extends string = string, U extends string = string>(
  gl: WebGL2RenderingContext,
  vert: string | WebGLShader,
  frag: string | WebGLShader,
): Material<A, U> | null => {

  const id = new_program(gl, vert, frag)!

  const attributes_map = new Map<string, Attribute_Pointer>
  const active_attributes_length = gl.getProgramParameter(id, gl.ACTIVE_ATTRIBUTES)

  for (let i = 0; i < active_attributes_length; i++) {
    const
      info   = gl.getActiveAttrib(id, i)!,
      name   = info.name,
      format = info.type as Attribute_Format

    attributes_map.set(name, {
      id:    gl.getAttribLocation(id, name),
      name,
      format,
      type:  attribute_type_map[format],
      size:  attribute_size_map[format],
      bytes: attribute_bytes_map[format],
    })
  }

  const uniforms_map = new Map<string, WebGLUniformLocation>
  const active_uniforms_length = gl.getProgramParameter(id, gl.ACTIVE_UNIFORMS)

  for (let i = 0; i < active_uniforms_length; i++) {
    const name = gl.getActiveUniform(id, i)!.name
    const loc = gl.getUniformLocation(id, name)!
    uniforms_map.set(name.endsWith("[0]") ? name.slice(0, -3) : name, loc)
  }

  const shaders = gl.getAttachedShaders(id)!

  return {
    id,
    attributes: Object.fromEntries(attributes_map.entries()) as Material<A, U>["attributes"],
    uniforms:   Object.fromEntries(uniforms_map.entries()) as Material<A, U>["uniforms"],
    vert:       gl.getShaderSource(shaders[0])!,
    frag:       gl.getShaderSource(shaders[1])!,
  }
}


export type Vertex_Data = {
  data:     ArrayBuffer | TypedArray
  vbo:      WebGLBuffer
  pointers: Binded_Attribute_Pointer[]
  count:    number
  /** pointers bytes sum */
  stride:   number
  usage:    Usage
}


type Usage =
| GL.STREAM_DRAW
| GL.STREAM_READ
| GL.STREAM_COPY
| GL.STATIC_DRAW
| GL.STATIC_READ
| GL.STATIC_COPY
| GL.DYNAMIC_DRAW
| GL.DYNAMIC_READ
| GL.DYNAMIC_COPY


const is_mat_attribute = (format: Attribute_Format): format is Attribute_Mat => {
  return format >= 35674 && format <= 35676 || format >= 35685 && format <= 35690
}


const new_binded_pointer = (p: Attribute_Pointer): Binded_Attribute_Pointer => ({ ...p, offset: 0 })


export const bind_vertex_data = (
  gl:       WebGL2RenderingContext,
  data:     ArrayBuffer | TypedArray | number,
  pointers: Attribute_Pointer[],
  divisor = 0,
  usage: Usage = GL.STATIC_DRAW,
): Vertex_Data => {

  let vbo: WebGLBuffer = null!
  let stride = 0
  const binded_pointers: Binded_Attribute_Pointer[] = []

  for (const pointer of pointers) {
    if (pointer === undefined) {
      console.warn("undefined pointer")
      continue
    }
    const binded = new_binded_pointer(pointer)
    binded.offset = stride
    stride += binded.bytes
    binded_pointers.push(binded)
  }

  if (binded_pointers.length) {
    vbo = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, data as AllowSharedBufferSource, usage)
  }

  for (const pointer of binded_pointers) {
    const
      id     = pointer.id,
      size   = pointer.size,
      format = pointer.format,
      type   = pointer.type,
      offset = pointer.offset

    if (is_mat_attribute(format)) {
      const columns = attribute_mat_columns_map[format]
      const row_bytes = size * 4
      for (let i = 0; i < columns; i++) {
        const index = id + i
        gl.vertexAttribPointer(index, size, type, false, stride, offset + i * row_bytes)
        gl.vertexAttribDivisor(index, divisor)
        gl.enableVertexAttribArray(index)
      }
      continue
    }

    if (type === GL.FLOAT) gl.vertexAttribPointer(id, size, type, false, stride, offset)
    else gl.vertexAttribIPointer(id, size, type, stride, offset)

    gl.vertexAttribDivisor(id, divisor)
    gl.enableVertexAttribArray(id)
  }

  const data_is_length = typeof data === "number"

  const count = stride ? (data_is_length ? data : data.byteLength) / stride : 0
  if (count === 0) {
    console.warn("no pointers provided, VBO wasn't initialized")
  }
  else if (fract(count) !== 0) {
    console.warn("data byte length is not aligned with pointers stride")
  }

  return { data: (data_is_length ? null! : data), vbo, pointers: binded_pointers, count, stride, usage }
}


export const rebind_vertex_data = (
  gl: WebGL2RenderingContext,
  attribute: Vertex_Data,
  data: ArrayBuffer | TypedArray,
) => {
  attribute.data = data
  attribute.count = data.byteLength / attribute.stride
  gl.bindBuffer(gl.ARRAY_BUFFER, attribute.vbo)
  gl.bufferData(gl.ARRAY_BUFFER, data, attribute.usage)
}


export type Uniform_Block = {
  id:   number
  name: string
  ubo:  WebGLBuffer
}


export const new_ubo = (
  gl: WebGL2RenderingContext,
  id: number,
  name: string,
  bytes: number,
  usage: Usage = gl.DYNAMIC_DRAW,
): Uniform_Block => {
  const ubo = gl.createBuffer()
  gl.bindBuffer(gl.UNIFORM_BUFFER, ubo)
  gl.bufferData(gl.UNIFORM_BUFFER, bytes, usage)
  gl.bindBufferBase(gl.UNIFORM_BUFFER, id, ubo)
  return { id, name, ubo }
}


export const bind_ubo = (
  gl:      WebGL2RenderingContext,
  ubo:     Uniform_Block,
  program: WebGLProgram,
): void => {
  const loc = gl.getUniformBlockIndex(program, ubo.name)
  if (loc !== gl.INVALID_INDEX) {
    gl.uniformBlockBinding(program, loc, ubo.id)
  } else {
    console.warn(`no "${ubo.name}"" UBO in program`)
  }
}


export const update_ubo = (
  gl:     WebGL2RenderingContext,
  ubo:    Uniform_Block,
  offset: number,
  data:   Float32Array,
): void => {
  gl.bindBuffer(gl.UNIFORM_BUFFER, ubo.ubo)
  gl.bufferSubData(gl.UNIFORM_BUFFER, offset, data)
}


type Texture_Mag_Filtering = GL.NEAREST | GL.LINEAR
type Texture_Min_Filtering = Texture_Mag_Filtering | GL.NEAREST_MIPMAP_NEAREST | GL.LINEAR_MIPMAP_NEAREST | GL.NEAREST_MIPMAP_LINEAR | GL.LINEAR_MIPMAP_LINEAR
type Texture_Wrap = GL.REPEAT | GL.CLAMP_TO_EDGE | GL.MIRRORED_REPEAT


export type Texture = {
  id:     number
  width:  number
  height: number
  txt:    WebGLTexture

  type:            number
  format:          number
  internal_format: Texture_Format

  mag_filter: Texture_Mag_Filtering
  min_filter: Texture_Min_Filtering
  wrap_s:     Texture_Wrap
  wrap_t:     Texture_Wrap
}


export type Texture_Format =
| GL.RGBA32F
| GL.RGB32F
| GL.RG32F
| GL.R32F
| GL.RGBA16F
| GL.RGB16F
| GL.RG16F
| GL.R16F
| GL.RGBA8
| GL.RGB8
| GL.RG8
| GL.R8
| GL.R8I
| GL.R8UI
| GL.R16I
| GL.R16UI
| GL.R32I
| GL.R32UI


const texture_format_map: Record<Texture_Format, number> = {
  [GL.RGBA32F]: GL.RGBA,
  [GL.RGB32F]:  GL.RGB,
  [GL.RG32F]:   GL.RG,
  [GL.R32F]:    GL.RED,

  [GL.RGBA16F]: GL.RGBA,
  [GL.RGB16F]:  GL.RGB,
  [GL.RG16F]:   GL.RG,
  [GL.R16F]:    GL.RED,

  [GL.RGBA8]: GL.RGBA,
  [GL.RGB8]:  GL.RGB,
  [GL.RG8]:   GL.RG,
  [GL.R8]:    GL.RED,

  [GL.R8I]:   GL.RED_INTEGER,
  [GL.R8UI]:  GL.RED_INTEGER,
  [GL.R16I]:  GL.RED_INTEGER,
  [GL.R16UI]: GL.RED_INTEGER,
  [GL.R32I]:  GL.RED_INTEGER,
  [GL.R32UI]: GL.RED_INTEGER,
}


const texture_type_map: Record<Texture_Format, number> = {
  [GL.RGBA32F]: GL.FLOAT,
  [GL.RGB32F]:  GL.FLOAT,
  [GL.RG32F]:   GL.FLOAT,
  [GL.R32F]:    GL.FLOAT,

  [GL.RGBA16F]: GL.HALF_FLOAT,
  [GL.RGB16F]:  GL.HALF_FLOAT,
  [GL.RG16F]:   GL.HALF_FLOAT,
  [GL.R16F]:    GL.HALF_FLOAT,

  [GL.RGBA8]: GL.UNSIGNED_BYTE,
  [GL.RGB8]:  GL.UNSIGNED_BYTE,
  [GL.RG8]:   GL.UNSIGNED_BYTE,
  [GL.R8]:    GL.UNSIGNED_BYTE,

  [GL.R8I]:   GL.BYTE,
  [GL.R8UI]:  GL.UNSIGNED_BYTE,
  [GL.R16I]:  GL.SHORT,
  [GL.R16UI]: GL.UNSIGNED_SHORT,
  [GL.R32I]:  GL.INT,
  [GL.R32UI]: GL.UNSIGNED_INT,
}


export type Texture_Params = Partial<{
  /** gl.NEAREST, gl.LINEAR */
  mag_filter: Texture_Mag_Filtering
  /** gl.NEAREST, gl.LINEAR, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR, gl.LINEAR_MIPMAP_LINEAR */
  min_filter: Texture_Min_Filtering

  /** gl.REPEAT, gl.CLAMP_TO_EDGE, gl.MIRRORED_REPEAT */
  wrap_s: Texture_Wrap
  /** gl.REPEAT, gl.CLAMP_TO_EDGE, gl.MIRRORED_REPEAT */
  wrap_t: Texture_Wrap

  internal_format: Texture_Format

  type:   number
  format: number
}>


const default_txt: Required<Texture_Params> = {
  mag_filter: 9728,
  min_filter: 9728,
  wrap_s:     33071,
  wrap_t:     33071,

  internal_format: GL.RGBA8,

  type:   0,
  format: 0,
}


/**
 * @param params defaults to gl.NEAREST as filters, gl.CLAMP_TO_EDGE as wraps, and gl.RGBA8 as internal_format
 */
export const new_texstore = (
  gl: WebGL2RenderingContext,
  id: number,
  width: number,
  height: number,
  params: Texture_Params | null = null,
  data: TypedArray | TexImageSource | null = null,
  flip_y = false,
): Texture => {

  params ??= default_txt

  const
    mag_filter = params.mag_filter || default_txt.mag_filter,
    min_filter = params.min_filter || default_txt.min_filter,

    wrap_s = params.wrap_s || default_txt.wrap_s,
    wrap_t = params.wrap_t || default_txt.wrap_t,

    internal_format = params.internal_format || default_txt.internal_format,
    type   = params.type   || texture_type_map[internal_format],
    format = params.format || texture_format_map[internal_format]

  const txt = gl.createTexture()!
  gl.activeTexture(gl.TEXTURE0 + id)
  gl.bindTexture(gl.TEXTURE_2D, txt)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag_filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min_filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap_s)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap_t)
  gl.texStorage2D(gl.TEXTURE_2D, 1, internal_format, width, height)

  if (data) {
    if (flip_y) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    }
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, format, type, data)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  }

  return {
    id,
    txt,
    width,
    height,
    type,
    format,
    internal_format,
    mag_filter,
    min_filter,
    wrap_s,
    wrap_t,
  }
}


export const upload_texture = (
  gl: WebGL2RenderingContext,
  texture: Texture,
  data: TypedArray | TexImageSource,
  flip_y = false,
) => {
  use_texture(gl, texture)
  if (flip_y) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  }
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, texture.width, texture.height, texture.format, texture.type, data)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
}


export const subupload_texture = (
  gl: WebGL2RenderingContext,
  texture: Texture,
  xoffset: number,
  yoffset: number,
  width: number,
  height: number,
  data: TypedArray | TexImageSource,
  flip_y = false,
) => {
  use_texture(gl, texture)
  if (flip_y) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  }
  gl.texSubImage2D(gl.TEXTURE_2D, 0, xoffset, yoffset, width, height, texture.format, texture.type, data)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
}


export const use_texture = (
  gl: WebGL2RenderingContext,
  texture: Texture,
) => {
  gl.activeTexture(gl.TEXTURE0 + texture.id)
  gl.bindTexture(gl.TEXTURE_2D,  texture.txt)
}


export const resize_texstore = (
  gl: WebGL2RenderingContext,
  texture: Texture,
  width: number,
  height: number,
) => {
  gl.deleteTexture(texture.txt)

  texture.width = width
  texture.height = height
  texture.txt = gl.createTexture()!
  use_texture(gl, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, texture.mag_filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, texture.min_filter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, texture.wrap_s)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, texture.wrap_t)
  gl.texStorage2D(gl.TEXTURE_2D, 1, texture.internal_format, width, height)
}


export type Render_Target = Texture & {
  fbo: WebGLFramebuffer
}


export const new_render_target = (
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  id: number,
  params: Texture_Params | null = null,
  data: TypedArray | TexImageSource | null = null,
  flip_y = false,
): Render_Target => {

  const fbo = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)

  const txt = new_texstore(gl, id, width, height, params, data, flip_y)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, txt.txt, 0)

  return Object.assign(txt, { fbo })
}


export type Feedback_Render_Target = {
  id:     number
  width:  number
  height: number
  read:   Render_Target
  write:  Render_Target
}


export const new_feedback_render_target = (
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  id: number,
  params: Texture_Params | null = null,
  data: TypedArray | TexImageSource | null = null,
  flip_y = false,
): Feedback_Render_Target => ({
  id,
  width,
  height,
  read:  new_render_target(gl, width, height, id, params, data, flip_y),
  write: new_render_target(gl, width, height, id, params),
})


export type Multiple_Render_Target<T extends string = string> = {
  fbo:    WebGLFramebuffer
  width:  number
  height: number
  attach: Record<T, Texture>
}


export const new_multiple_render_target = <T extends string>(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  attach: Record<T, {
    id:      number
    params?: Texture_Params | null
    data?:   TypedArray | TexImageSource | null
    flip_y?: boolean
  }>,
): Multiple_Render_Target<T> => {
  const fbo = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)

  let attach_id = 0
  const attachments: Record<string, Texture> = {}
  for (const name in attach) {
    const src = attach[name]
    src.data ??= null
    src.params ??= null
    src.flip_y ??= false
    const txt = new_texstore(gl, src.id, width, height, src.params, src.data, src.flip_y)
    attachments[name] = txt
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + attach_id++, gl.TEXTURE_2D, txt.txt, 0)
  }

  gl.drawBuffers(Array(attach_id).fill(0).map((_, i) => gl.COLOR_ATTACHMENT0 + i))

  return {
    fbo,
    width,
    height,
    attach: attachments,
  }
}


export type Feedback_Multiple_Render_Target<T extends string = string> = {
  width:  number
  height: number
  read:   Multiple_Render_Target<T>
  write:  Multiple_Render_Target<T>
}


export const new_feedback_multiple_render_target = <T extends string>(
  gl: WebGL2RenderingContext,
  width: number,
  height: number,
  attach: Record<T, {
    id:      number
    params?: Texture_Params | null
    data?:   TypedArray | TexImageSource | null
    flip_y?: boolean
  }>,
): Feedback_Multiple_Render_Target<T> => ({
  width,
  height,
  read:  new_multiple_render_target(gl, width, height, attach),
  write: new_multiple_render_target(gl, width, height, attach),
})


export const bind_render_target = (
  gl: WebGL2RenderingContext,
  rt: Render_Target,
): void => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fbo)
}


export const bind_canvas_target = (
  gl: WebGL2RenderingContext,
): void => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}


export const resize_render_target = (
  gl: WebGL2RenderingContext,
  rt: Render_Target,
  width: number,
  height: number,
): void => {
  resize_texstore(gl, rt, width, height)
  gl.bindFramebuffer(gl.FRAMEBUFFER, rt.fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rt.txt, 0)
}


export const resize_multiple_render_target = <T extends string>(
  gl: WebGL2RenderingContext,
  mrt: Multiple_Render_Target<T>,
  width: number,
  height: number,
): void => {
  gl.bindFramebuffer(gl.FRAMEBUFFER, mrt.fbo)

  let attach_id = 0
  for (const name in mrt.attach) {
    const texture: Texture = mrt.attach[name]
    resize_texstore(gl, texture, width, height)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + attach_id++, gl.TEXTURE_2D, texture.txt, 0)
  }

  mrt.width = width
  mrt.height = height
}


export const resize_feedback_render_target = (
  gl: WebGL2RenderingContext,
  rt: Feedback_Render_Target,
  width: number,
  height: number,
): void => {
  resize_render_target(gl, rt.read, width, height)
  resize_render_target(gl, rt.write, width, height)
  rt.width = width
  rt.height = height
}


export const resize_feedback_multiple_render_target = <T extends string>(
  gl: WebGL2RenderingContext,
  rt: Feedback_Multiple_Render_Target<T>,
  width: number,
  height: number,
): void => {
  resize_multiple_render_target(gl, rt.read, width, height)
  resize_multiple_render_target(gl, rt.write, width, height)
  rt.width = width
  rt.height = height
}


export const swap_feedback_render_target = (
  rt: Feedback_Render_Target | Feedback_Multiple_Render_Target,
): void => {
  const temp = rt.write
  rt.write = rt.read
  rt.read = temp
}


export const new_program = (
  gl: WebGL2RenderingContext,
  vert: string | WebGLShader,
  frag: string | WebGLShader,
): WebGLProgram | null => {

  vert = new_shader(gl, gl.VERTEX_SHADER, vert)!
  frag = new_shader(gl, gl.FRAGMENT_SHADER, frag)!

  if (!vert || !frag) {
    return null
  }

  const program = gl.createProgram()!
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)
  const linked = gl.getProgramParameter(program, gl.LINK_STATUS)

  if (!linked) {
    console.error(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}


export const new_shader = (
  gl: WebGL2RenderingContext,
  type: WebGL2RenderingContext["VERTEX_SHADER"] | WebGL2RenderingContext["FRAGMENT_SHADER"],
  source: string | WebGLShader,
): WebGLShader | null => {

  if (source instanceof WebGLShader) {
    return source
  }

  const src = (source.startsWith("#version 300 es\n") ? "" : "#version 300 es\n") + source

  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

  if (!compiled) {
    const error = gl.getShaderInfoLog(shader)!
    console.error(error)
    parse_error(src, error)
    gl.deleteShader(shader)
    return null
  }

  return shader
}


const rgx = /ERROR: \d:(\d+): /

const parse_error = (
  source: string,
  error: string,
) => {
  const src_lines = source.split("\n")
  const errors = error.split("\n")

  for (const err of errors) if (rgx.test(err)) {
    const line_num = parseInt(err.match(rgx)![1])
    console.log(
      `${line_num}: ${src_lines[line_num - 1].trim()}\n: ${err.replace(rgx, "")}`,
    )
  }
}
