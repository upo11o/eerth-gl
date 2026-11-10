#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;


uniform sampler2D state_map;
uniform sampler2D rotation_state_map;
uniform usampler2D flow_id_map;
uniform sampler2D position_map;
uniform sampler2D rotation_map;
uniform sampler2D scale_map;
uniform uint  flow_count;
uniform float dt;
uniform float flow_time;
uniform float flow_freq;
uniform float flow_evolve;
uniform float flow_turn;

//#include psrdnoise
//#include flow

layout(location = 0) out vec4 State;
layout(location = 1) out vec4 Rotation;


// quaternions are xyz + w scalar, the layout of rotation_map
vec3 quat_rotate(vec4 q, vec3 v) {
    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
}


vec4 quat_mult(vec4 a, vec4 b) {
    return vec4(a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz));
}


// turns the longest axis of a splat towards dir, by a share of the angle between them
vec4 align(vec4 q, vec3 scale, vec3 dir, float share) {
    vec3 e = scale.x > scale.y ? (scale.x > scale.z ? vec3(1, 0, 0) : vec3(0, 0, 1)) : (scale.y > scale.z ? vec3(0, 1, 0) : vec3(0, 0, 1));
    vec3 a = quat_rotate(q, e);
    // the axis has no head, so the closer end turns
    if (dot(a, dir) < 0.0) dir = -dir;

    vec3 c = cross(a, dir);
    float s = length(c);
    if (s < 1e-6) return q;

    float angle = atan(s, dot(a, dir)) * share;
    vec4 dq = vec4(c / s * sin(angle * 0.5), cos(angle * 0.5));
    return normalize(quat_mult(dq, q));
}


void main(void) {
    ivec2 uv = ivec2(gl_FragCoord.xy);
    vec4 s = texelFetch(state_map, uv, 0);
    vec4 q = texelFetch(rotation_state_map, uv, 0);

    // the viewport covers whole rows, the tail of the last one is empty
    uint slot = uint(uv.y * textureSize(state_map, 0).x + uv.x);
    if (slot >= flow_count) {
        State = s;
        Rotation = q;
        return;
    }

    uint id = texelFetch(flow_id_map, uv, 0).r;
    uint w = uint(textureSize(position_map, 0).x);
    ivec2 src = ivec2(id % w, id / w);
    vec3 p0 = texelFetch(position_map, src, 0).xyz;
    vec4 q0 = texelFetch(rotation_map, src, 0);
    vec3 scale = texelFetch(scale_map, src, 0).xyz;
    Flow f = flow_params(id);

    vec3 p = s.xyz; // flow position
    float t = s.w; // cycle phase t

    // first frame after load: start a cycle as a soft splat
    if (t < 0.0) {
        p = p0;
        q = q0;
        t = 0.0;
    }

    // seed picks another region of noise space and gradient rotation, so another field
    vec4 r = vec4(pcg4d(uvec4(flow_seed, 0x2545f491u, 0x68e31da4u, 0xb5297a4du)) >> 8u) * (1.0 / 16777216.0);
    vec3 field_offset = r.xyz * 256.0;
    float field_phase = r.w * 6.2831853;

    vec3 v = curl(p * flow_freq + field_offset, flow_time * flow_evolve + field_phase) * f.speed;

    t += dt;
    p += v * dt;
    // frame rate independent smoothing
    if (dot(v, v) > 1e-20) q = align(q, scale, normalize(v), 1.0 - exp(-flow_turn * dt));

    if (t > f.limit) {
        p = p0;
        q = q0;
        t = 0.0;
    }

    State = vec4(p, t);
    Rotation = q;
}
