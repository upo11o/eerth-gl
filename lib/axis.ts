import { get_cone_y, get_tube_y } from "./geometry"
import { bind_vertex_data, type Material, new_material } from "./gl"


const xc = [ 0.9, 0.35, 0, 1 ]
const yc = [ 0.3, 0.7, 0.1, 1 ]
const zc = [ 0, 0.6, 1, 1 ]

const tube_segments = 8
const cone_segments = 12
const axis_vertices = (tube_segments + cone_segments) * 6 * 3

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
  const tube = get_tube_y(0.005, 0.9, tube_segments)
  const cone = get_cone_y(0.04, 0.1, cone_segments)
  const geometry: number[] = []
  // x
  for (let i = 0; i < tube.length; i += 3)
    geometry.push(0.45 + tube[i + 1], -tube[i], tube[i + 2], 1, ...xc)
  for (let i = 0; i < cone.length; i += 3)
    geometry.push(0.9 + cone[i + 1], -cone[i], cone[i + 2], 1, ...xc)
  // y
  for (let i = 0; i < tube.length; i += 3)
    geometry.push(tube[i], 0.45 + tube[i + 1], tube[i + 2], 1, ...yc)
  for (let i = 0; i < cone.length; i += 3)
    geometry.push(cone[i], 0.9 + cone[i + 1], cone[i + 2], 1, ...yc)
  // z
  for (let i = 0; i < tube.length; i += 3)
    geometry.push(tube[i], -tube[i + 2], 0.45 + tube[i + 1], 1, ...zc)
  for (let i = 0; i < cone.length; i += 3)
    geometry.push(cone[i], -cone[i + 2], 0.9 + cone[i + 1], 1, ...zc)

  const axis = new_material(gl, input + axis_vert + output + ";}", axis_frag)!
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  bind_vertex_data(gl, new Float32Array(geometry), [ axis.attributes.g, axis.attributes.c ])

  return Object.assign(axis, { vao })
}


export const draw_axis = (gl: WebGL2RenderingContext) => {
  gl.drawArrays(4, 0, axis_vertices)
}
