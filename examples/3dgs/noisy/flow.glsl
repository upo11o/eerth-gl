// shared by advect.glsl and noisy-vert.glsl
// state holds only flowing splats, compacted into slots, flow_id_map gives the splat id of a slot
// state texel: xyz = current position, w = cycle phase t in seconds, t < 0 = just loaded
// rotation state texel: current quaternion, xyz + w scalar like rotation_map


uniform uint  flow_seed;
uniform vec2  flow_fade;     // in, out, each 0..0.5, share of limit spent fading
uniform vec2  flow_speed;    // min, max
uniform vec2  flow_limit;    // min, max travel time before a restart, seconds


struct Flow {
    float speed;
    float limit;    // travel time, seconds
};


// Jarzynski & Olano, Hash Functions for GPU Rendering
uvec4 pcg4d(uvec4 v) {
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
    v ^= v >> 16u;
    v.x += v.y * v.w; v.y += v.z * v.x; v.z += v.x * v.y; v.w += v.y * v.z;
    return v;
}


Flow flow_params(uint id) {
    // 24 bits keep the uint -> float conversion exact, so r < 1
    vec4 r = vec4(pcg4d(uvec4(id, flow_seed, 0x9e3779b9u, 0x85ebca6bu)) >> 8u) * (1.0 / 16777216.0);

    Flow f;
    f.speed = mix(flow_speed.x, flow_speed.y, r.y);
    f.limit = mix(flow_limit.x, flow_limit.y, r.z);
    return f;
}


// seconds of fade in after a restart (x) and of fade out before it (y)
vec2 flow_fade_time(Flow f) {
    return clamp(flow_fade, 0.0, 0.5) * f.limit;
}


// smoothstep is undefined for equal edges, so 0 fade time is handled apart

// 0 -> 1 after a restart, morphs a gaussian splat into a solid quad
float flow_fade_in(Flow f, float t) {
    float F = flow_fade_time(f).x;
    if (t < 0.0) return 0.0; // just loaded, soft
    return F <= 0.0 ? 1.0 : smoothstep(0.0, F, t);
}


// 1 -> 0 before a restart, alpha
float flow_fade_out(Flow f, float t) {
    float F = flow_fade_time(f).y;
    return t < 0.0 || F <= 0.0 ? 1.0 : smoothstep(f.limit, f.limit - F, t);
}
