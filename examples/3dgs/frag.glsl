#version 300 es
precision highp float;


in vec2 uv;
flat in vec4 color;
out vec4 Color;


void main(void) {
  float A = dot(uv, uv);
  if (A > 1.0) discard;

  // A = step(0.1, 1.0 - A);

  A = exp(-A * 4.0) * color.a;  
  if (A < 1.0 / 255.0) discard;

  Color = vec4(color.rgb * A, A);
}