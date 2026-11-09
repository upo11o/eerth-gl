#version 300 es
precision highp float;


in vec2 uv;
flat in vec4 color;
flat in float solid;
out vec4 Color;


void main(void) {
  float A = dot(uv, uv);
  // gaussian falloff inside the unit circle for origins, flat 1 over the whole quad for flowing splats
  float G = A > 1.0 ? 0.0 : exp(-A * 4.0);

  A = mix(G, 1.0, solid) * color.a;
  if (A < 1.0 / 255.0) discard;

  Color = vec4(color.rgb * A, A);
}
