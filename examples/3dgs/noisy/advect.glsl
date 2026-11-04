#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;


uniform sampler2D state_map;
uniform usampler2D flow_id_map;
uniform sampler2D position_map;
uniform uint  flow_count;
uniform float dt;
uniform float flow_time;
uniform float flow_freq;
uniform float flow_evolve;

//#include psrdnoise
//#include flow

out vec4 State;


void main(void) {
    ivec2 uv = ivec2(gl_FragCoord.xy);
    vec4 s = texelFetch(state_map, uv, 0);

    // the viewport covers whole rows, the tail of the last one is empty
    uint slot = uint(uv.y * textureSize(state_map, 0).x + uv.x);
    if (slot >= flow_count) {
        State = s;
        return;
    }

    uint id = texelFetch(flow_id_map, uv, 0).r;
    uint w = uint(textureSize(position_map, 0).x);
    vec3 p0 = texelFetch(position_map, ivec2(id % w, id / w), 0).xyz;
    Flow f = flow_params(id);

    vec3 p = s.xyz; // flow position
    float t = s.w; // cycle phase t

    // first frame after load: start a cycle as a soft splat
    if (t < 0.0) {
        p = p0;
        t = 0.0;
    }

    // seed picks another region of noise space and gradient rotation, so another field
    vec4 r = vec4(pcg4d(uvec4(flow_seed, 0x2545f491u, 0x68e31da4u, 0xb5297a4du)) >> 8u) * (1.0 / 16777216.0);
    vec3 field_offset = r.xyz * 256.0;
    float field_phase = r.w * 6.2831853;

    t += dt;
    p += curl(p * flow_freq + field_offset, flow_time * flow_evolve + field_phase) * f.speed * dt;

    if (t > f.limit) {
        p = p0;
        t = 0.0;
    }

    State = vec4(p, t);
}
