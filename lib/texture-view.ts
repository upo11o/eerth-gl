import { type Material, new_material, type Texture } from "./gl"
import { bind_quad_vao, init_quad_vao, render_quad } from "./quad"

let quad: Material<never, "b" | "t">
let box_loc: WebGLUniformLocation


export const init_texture_view = (
  gl: WebGL2RenderingContext,
) => {
  init_quad_vao(gl)
  quad = new_material(gl,
    /*glsl*/"in vec2 p;uniform vec4 b;out vec2 c;void main(){c=p*.5+.5;gl_Position=vec4(b.xy+p*b.zw,0,1);}",
    /*glsl*/"in vec2 c;uniform sampler2D t;out vec4 o;void main(){o=texture(t,c);}",
  )!
  box_loc = quad.uniforms.b
}

/** param box [ x, y, width, height ] */
export const texture_view_draw = (
  gl: WebGL2RenderingContext,
  txt: Texture,
  box: number[] | Float32Array,
) => {
  bind_quad_vao(gl)
  gl.useProgram(quad.id)
  gl.activeTexture(33984) // gl.TEXTURE0
  gl.bindTexture(3553, txt.txt)
  gl.uniform4fv(box_loc, box)
  render_quad(gl)
}
