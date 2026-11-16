import { bind_render_target, type Material, type Render_Target, type Texture } from "../gl"
import { bind_quad_vao, new_quad_material, render_quad } from "../quad"


type Normal_Pass_Material = Material<never, "map" | "normal_scale">

const get_normal_shader = (sobel_impl: string) => /*glsl*/`
precision highp float;
uniform sampler2D map;
uniform float normal_scale;
in vec2 vuv;
out vec4 Color;

float get_height(vec2 uv) {
  return texture(map, uv).r;
}
${sobel_impl}

void main() {
  vec2 ts = 1.0 / vec2(textureSize(map, 0));
  vec3 normal = sobel(vuv, ts);
  Color = vec4(normal, 1);
}`

const sobel3 = /*glsl*/`
vec3 sobel(vec2 uv, vec2 ts) {
  float height = get_height(uv);
  vec2 dxy = height - vec2(get_height(uv + vec2(ts.x, 0.0)), get_height(uv + vec2(0.0, ts.y)));
  return normalize(vec3(dxy * normal_scale / ts, 1.0)) * 0.5 + 0.5;
}`

const sobel9 = /*glsl*/`
vec3 sobel(vec2 uv, vec2 ts) {
  float tl = get_height(uv + vec2(-ts.x, -ts.y));
  float  l = get_height(uv + vec2(-ts.x,     0));
  float bl = get_height(uv + vec2(-ts.x,  ts.y));
  float tr = get_height(uv + vec2( ts.x, -ts.y));
  float  r = get_height(uv + vec2( ts.x,     0));
  float br = get_height(uv + vec2( ts.x,  ts.y));
  float  t = get_height(uv + vec2(    0, -ts.y));
  float  b = get_height(uv + vec2(    0,  ts.y));
  float dx = tr + br - tl - bl + 2.0 * (r - l);
  float dy = bl + br - tl - tr + 2.0 * (b - t);
  vec2 dxy = vec2(dx, dy) * -0.125;
  return normalize(vec3(dxy * normal_scale / ts, 1.0)) * 0.5 + 0.5;
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
  gl.uniform1f(material.uniforms.normal_scale, normal_scale)
  render_quad(gl)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}
