import { bind_render_target, type Material, Render_Target, Texture } from "../gl"
import { bind_quad_vao, new_quad_material, render_quad } from "../quad"


export type Contrast_Pass_Material = Material<never, "map" | "amount">

export const new_contrast_pass = (
  gl: WebGL2RenderingContext,
  premultiplied = false,
): Contrast_Pass_Material => {
  return new_quad_material(gl, /*glsl*/`
    precision highp float;
    uniform sampler2D map;
    uniform float amount;
    in vec2 vuv;
    out vec4 Color;
    void main() {
      vec4 c = texture(map, vuv);
      Color = vec4(((c.rgb - 0.5) * amount + 0.5) * ${premultiplied ? "c.a" : "1.0"}, c.a);
    }`,
  )
}

export const apply_contrast_pass = (
  gl: WebGL2RenderingContext,
  material: Contrast_Pass_Material,
  amount: number,
  source: Texture,
  target: Render_Target,
): void => {
  gl.viewport(0, 0, target.width, target.height)
  bind_render_target(gl, target)

  gl.activeTexture(gl.TEXTURE0 + 0)
  gl.bindTexture(gl.TEXTURE_2D, source.txt)

  bind_quad_vao(gl)
  gl.useProgram(material.id)
  gl.uniform1f(material.uniforms.amount, amount)
  render_quad(gl)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}
