import { bind_render_target, type Material, type Render_Target, type Texture } from "../gl"
import { bind_quad_vao, new_quad_material, render_quad } from "../quad"


/** R = edge magnitude; with with_direction, G = gradient angle normalized to [0, 1] */
export const new_edge_pass = (gl: WebGL2RenderingContext): Material<never, "map"> => {
  return new_quad_material(gl, /*glsl*/`
    precision highp float;
    uniform sampler2D map;
    in vec2 vuv;
    out vec4 Color;

    float luminance(vec2 uv) {
      return dot(texture(map, uv).rgb, vec3(0.299, 0.587, 0.114));
    }

    void main() {
      vec2 ts = 1.0 / vec2(textureSize(map, 0));

      float tl = luminance(vuv + vec2(-ts.x, -ts.y));
      float  t = luminance(vuv + vec2(    0, -ts.y));
      float tr = luminance(vuv + vec2( ts.x, -ts.y));
      float  l = luminance(vuv + vec2(-ts.x,     0));
      float  r = luminance(vuv + vec2( ts.x,     0));
      float bl = luminance(vuv + vec2(-ts.x,  ts.y));
      float  b = luminance(vuv + vec2(    0,  ts.y));
      float br = luminance(vuv + vec2( ts.x,  ts.y));

      float dx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
      float dy = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

      float edge = length(vec2(dx, dy));
      Color = vec4(edge, dx, dy, 1.0);
    }`,
  )
}


export const apply_edge_pass = (
  gl: WebGL2RenderingContext,
  material: Material,
  source: Texture,
  target: Render_Target,
): void => {
  gl.viewport(0, 0, target.width, target.height)
  bind_render_target(gl, target)

  gl.activeTexture(gl.TEXTURE0 + 0)
  gl.bindTexture(gl.TEXTURE_2D, source.txt)

  bind_quad_vao(gl)
  gl.useProgram(material.id)
  render_quad(gl)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}
