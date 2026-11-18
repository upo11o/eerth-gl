import { factorial } from "../math"
import { bind_render_target, type Material, swap_feedback_render_target, type Feedback_Render_Target } from "../gl"
import { bind_quad_vao, new_quad_material, render_quad } from "../quad"


/** kernel sizes go from 5 with step of 4, like [5,9,13,17,etc.] */
const get_blur_kernel = (n: number) => {
  n = n + 3
  const weights: number[] = []
  const start_id = n / 2 | 0
  let sum = 0

  for (let i = start_id; i < n - 1; i++) {
    const v = factorial(n) / (factorial(n - i) * factorial(i))
    sum += i === start_id ? v : v * 2
    weights.push(v)
  }

  sum = 1 / sum
  for (let i = 0; i < weights.length; i++) {
    weights[i] *= sum
  }

  const weight = new Float32Array(((weights.length - 1) / 2 | 0) + 1)
  weight[0] = weights[0]
  const offset = new Float32Array(weight.length)
  offset[0] = 0

  for (let di = 1, li = 1; di < weights.length - 1; di += 2, li += 1) {
    weight[li] = weights[di] + weights[di + 1]
    offset[li] = (di * weights[di] + (di + 1) * weights[di + 1]) / weight[li]
  }

  return { weight, offset }
}


const dir = [
  new Float32Array([ 1, 0 ]),
  new Float32Array([ 0, 1 ]),
] as const


export const new_blur_pass = (
  gl: WebGL2RenderingContext,
  kernel_size: number,
) => {
  const sample_len = ((kernel_size - 1) / 4 | 0) + 1

  const blur = new_quad_material<"m" | "w" | "o" | "d">(gl, /*glsl*/`#define u uniform\nu sampler2D m;u float[${sample_len}] w;u float[${sample_len}] o;u vec2 d;in vec2 vuv;out vec4 O;void main(){vec2 s=1./vec2(textureSize(m,0));vec4 v=texture(m,vuv)*w[0];for(int i=1;i<${sample_len};i++){v+=texture(m,vuv+d*s*o[i])*w[i];v+=texture(m,vuv-d*s*o[i])*w[i];}O=v;}`)

  gl.useProgram(blur.id)

  const kernel = get_blur_kernel(kernel_size)
  gl.uniform1fv(blur.uniforms.w, kernel.weight)
  gl.uniform1fv(blur.uniforms.o, kernel.offset)

  return blur
}


export const apply_blur_pass = (
  gl: WebGL2RenderingContext,
  material: Material,
  target: Feedback_Render_Target,
  repeat = 1,
) => {
  gl.viewport(0, 0, target.width, target.height)

  bind_quad_vao(gl)
  gl.useProgram(material.id)
  gl.activeTexture(gl.TEXTURE0 + 0)

  for (let i = 0; i < repeat; i++) {
    for (let d = 0; d < 2; d++) {
      bind_render_target(gl, target.write)
      gl.uniform2fv(material.uniforms.d, dir[d])
      gl.bindTexture(gl.TEXTURE_2D, target.read.txt)
      render_quad(gl)
      swap_feedback_render_target(target)
    }
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}
