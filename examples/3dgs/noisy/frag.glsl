#version 300 es
precision highp float;


in vec2 uv;
flat in vec4 color;
flat in float solid;
out vec4 Color;


vec3 vibrance(vec3 color, float amount)
{
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float mx = max(color.r, max(color.g, color.b));
    float mn = min(color.r, min(color.g, color.b));
    float sat = mx - mn;                       // current saturation, 0..1
    float k = amount * (1.0 - sat);            // less boost for vivid pixels
    return mix(vec3(luma), color, 1.0 + k);    // amount > 0 boosts, < 0 mutes
}


void main(void) {
  float A = dot(uv, uv);
  // gaussian falloff inside the unit circle for origins, flat 1 over the whole quad for flowing splats
  float G = A > 1.0 ? 0.0 : exp(-A * 4.0);

  A = mix(G, 1.0, solid) * color.a;
  if (A < 1.0 / 255.0) discard;

  Color = vec4(vibrance(color.rgb * A, solid), A);
}
