import { type Material, new_material, new_shader } from "./gl"


let vert: WebGLShader
let vao: WebGLVertexArrayObject | null = null

const vert_src = /*glsl*/"in vec2 p;out vec2 vuv;void main(){vuv=p*0.5+0.5;gl_Position=vec4(p,0,1);}"


export const new_quad_material = <U extends string>(
  gl: WebGL2RenderingContext,
  frag: string | WebGLShader,
): Material<never, U> => {

  if (vao === null) {
    vao = gl.createVertexArray()!
    gl.bindVertexArray(vao)
    gl.bindBuffer(34962, gl.createBuffer()!)
    gl.bufferData(34962, new Float32Array([ -1, -1, 1, -1, -1, 1, 1, 1 ]), 35044)
    gl.vertexAttribPointer(0, 2, 5126, false, 8, 0)
    gl.enableVertexAttribArray(0)

    vert = new_shader(gl, 35633, vert_src)!
  }

  return new_material<never, U>(gl, vert, frag)!
}


export const render_quad = (gl: WebGL2RenderingContext) => {
  gl.drawArrays(5, 0, 4)
}


export const bind_quad_vao = (gl: WebGL2RenderingContext) => {
  gl.bindVertexArray(vao)
}
