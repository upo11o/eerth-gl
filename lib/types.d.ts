type Nullish = null | undefined
type Primitive = string | number | boolean

type Prettify<T> = { [K in keyof T]: T[K]} & {}

type Tuple<T, N extends number, R extends T[] = []> = R["length"] extends N ? R : Tuple<T, N, [ T, ...R ]>

type TypedArray =
| Int8Array
| Uint8Array
| Uint8ClampedArray
| Int16Array
| Uint16Array
| Int32Array
| Uint32Array
| Float16Array
| Float32Array
| Float64Array

type NumberArray = number[] | TypedArray

interface WebGLTexture           { WebGLTexture:           unknown }
interface WebGLShader            { WebGLShader:            unknown }
interface WebGLProgram           { WebGLProgram:           unknown }
interface WebGLBuffer            { WebGLBuffer:            unknown }
interface WebGLFramebuffer       { WebGLFramebuffer:       unknown }
interface WebGLRenderbuffer      { WebGLRenderbuffer:      unknown }
interface WebGLUniformLocation   { WebGLUniformLocation:   unknown }
interface WebGLSampler           { WebGLSampler:           unknown }
interface WebGLQuery             { WebGLQuery:             unknown }
interface WebGLVertexArrayObject { WebGLVertexArrayObject: unknown }
interface WebGLSync              { WebGLSync:              unknown }
interface WebGLTransformFeedback { WebGLTransformFeedback: unknown }

interface WebGL2RenderingContextOverloads {

  texSubImage2D(
    target:  GLenum,
    level:   GLint,
    xoffset: GLint,
    yoffset: GLint,
    width:   GLsizei,
    height:  GLsizei,
    format:  GLenum,
    type:    GLenum,
    source:  TexImageSource | ArrayBufferView<ArrayBufferLike> | null
  ): void

  texImage2D(
    target:  GLenum,
    level:   GLint,
    xoffset: GLint,
    yoffset: GLint,
    width:   GLsizei,
    height:  GLsizei,
    format:  GLenum,
    type:    GLenum,
    source:  TexImageSource | ArrayBufferView<ArrayBufferLike> | null
  ): void
}
