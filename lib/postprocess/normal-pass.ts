import { bind_render_target, type Material, type Render_Target, type Texture } from "../gl"
import { bind_quad_vao, new_quad_material, render_quad } from "../quad"


type Normal_Pass_Material = Material<never, "m" | "n">

const get_normal_shader = (sobel_impl: string) => /*glsl*/`uniform sampler2D m;uniform float n;in vec2 vuv;out vec4 O;float h(vec2 c){return texture(m, c).r;}${sobel_impl}void main(){vec2 s=1./vec2(textureSize(m,0));O=vec4(sobel(vuv, s), 1);}`

const sobel3 = /*glsl*/"vec3 sobel(vec2 c,vec2 s){float v=h(c);vec2 d=v-vec2(h(c+vec2(s.x,0.)),h(c+vec2(0.,s.y)));return normalize(vec3(d*n/s,1.))*.5+.5;}"

const sobel9 = /*glsl*/`
vec3 sobel(vec2 uv, vec2 ts) {
  float tl = h(uv + vec2(-ts.x, -ts.y));
  float  l = h(uv + vec2(-ts.x,     0));
  float bl = h(uv + vec2(-ts.x,  ts.y));
  float tr = h(uv + vec2( ts.x, -ts.y));
  float  r = h(uv + vec2( ts.x,     0));
  float br = h(uv + vec2( ts.x,  ts.y));
  float  t = h(uv + vec2(    0, -ts.y));
  float  b = h(uv + vec2(    0,  ts.y));
  float dx = tr + br - tl - bl + 2.0 * (r - l);
  float dy = bl + br - tl - tr + 2.0 * (b - t);
  vec2 dxy = vec2(dx, dy) * -0.125;
  return normalize(vec3(dxy * n / ts, 1.0)) * 0.5 + 0.5;
}`

export const new_normal3_pass = (
  gl: WebGL2RenderingContext,
): Normal_Pass_Material => {
  return new_quad_material(gl, get_normal_shader(sobel3))
}

export const new_normal9_pass = (
  gl: WebGL2RenderingContext,
): Normal_Pass_Material => {
  return new_quad_material(gl, get_normal_shader(sobel9))
}

export const apply_normal_pass = (
  gl: WebGL2RenderingContext,
  material: Normal_Pass_Material,
  normal_scale: number,
  source: Texture,
  target: Render_Target,
): void => {
  gl.viewport(0, 0, target.width, target.height)
  bind_render_target(gl, target)

  gl.activeTexture(gl.TEXTURE0 + 0)
  gl.bindTexture(gl.TEXTURE_2D, source.txt)

  bind_quad_vao(gl)
  gl.useProgram(material.id)
  gl.uniform1f(material.uniforms.n, normal_scale)
  render_quad(gl)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}
