// shared by advect.glsl and noisy-vert.glsl
// state texel: xyz = current position, w = cycle phase t in seconds, t < 0 = just loaded


uniform uint  flow_seed;
uniform vec2  flow_fade;     // in, out, each 0..0.5, share of limit spent fading
uniform vec2  flow_speed;    // min, max
uniform vec2  flow_limit;    // min, max travel time before a restart, seconds


struct Flow {
    float shift;    // initial phase, fraction of limit
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
    f.shift = r.x;
    f.speed = mix(flow_speed.x, flow_speed.y, r.y);
    f.limit = mix(flow_limit.x, flow_limit.y, r.z);
    return f;
}


// seconds of fade in after a restart (x) and of fade out before it (y)
vec2 flow_fade_time(Flow f) {
    return clamp(flow_fade, 0.0, 0.5) * f.limit;
}


// fades in after a restart and fades out before it
float flow_alpha(Flow f, float t) {
    if (t < 0.0) return 1.0;
    vec2 F = flow_fade_time(f);
    // smoothstep is undefined for equal edges
    float fade_in  = F.x > 0.0 ? smoothstep(0.0, F.x, t) : 1.0;
    float fade_out = F.y > 0.0 ? smoothstep(f.limit, f.limit - F.y, t) : 1.0;
    return min(fade_in, fade_out);
}
