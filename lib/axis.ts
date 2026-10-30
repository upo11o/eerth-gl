import { IOTA } from "./math"
import { get_cone_y } from "./geometry"
import { bind_vertex_data, type Material, new_material } from "./gl"


const origin = [ 0, 0, 0, 1 ]

const xc = [ 1, 0.3, 0, 1 ]
const yc = [ 0, 0.8, 0, 1 ]
const zc = [ 0, 0.8, 1, 1 ]

const attr = [
  ...origin, ...xc,  0.9, 0, 0, 1, ...xc,
  ...origin, ...yc,  0, 0.9, 0, 1, ...yc,
  ...origin, ...zc,  0, 0, 0.9, 1, ...zc,
]

const cone = get_cone_y(4, 0.1, 0.03, IOTA * 0.5)
// x
for (let i = 0; i < cone.length; i += 3) {
  attr.push(0.9 + cone[i + 1], -cone[i], cone[i + 2], 1, ...xc)
}
// y
for (let i = 0; i < cone.length; i += 3) {
  attr.push(cone[i], 0.9 + cone[i + 1], cone[i + 2], 1, ...yc)
}
// z
for (let i = 0; i < cone.length; i += 3) {
  attr.push(cone[i], -cone[i + 2], 0.9 + cone[i + 1], 1, ...zc)
}

const lines_count = 6
const tris_count = cone.length // len / 3 * 3

const axis_vert = /*glsl*/"\n#define p gl_Position\nin vec4 g;in vec4 c;out vec4 v;void main(){v=c;p=g;"
const axis_frag = /*glsl*/"precision highp float;in vec4 v;out vec4 o;void main(){o=v;}"


/**
 * @param input define input
 * @param output assign output to vec4 p
 * @example input "uniform mat4 world", output "p=world*p"
 */
export const new_axis = (
  gl: WebGL2RenderingContext,
  input = "",
  output = "",
): Material & { vao: WebGLVertexArrayObject } => {
  const axis = new_material(gl, input + axis_vert + output + ";}", axis_frag)!
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  bind_vertex_data(gl, new Float32Array(attr), [ axis.attributes.g, axis.attributes.c ])

  return Object.assign(axis, { vao })
}


export const draw_axis = (gl: WebGL2RenderingContext) => {
  gl.drawArrays(gl.LINES, 0, lines_count)
  gl.drawArrays(gl.TRIANGLES, lines_count, tris_count)
}
