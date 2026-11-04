// shared by advect.glsl and noisy-vert.glsl
// state texel: xyz = current position, w = cycle phase t in seconds, t < 0 = just loaded


uniform uint  flow_seed;
uniform float flow_fade;     // fade in/out time, seconds
uniform float flow_cycle;    // mean cycle duration, seconds
uniform vec2  flow_speed;    // min, max
uniform vec2  flow_limit;    // min, max distance from origin


struct Flow {
    float shift;    // initial phase, fraction of duration
    float speed;
    float limit;
    float duration;
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
    f.shift    = r.x;
    f.speed    = mix(flow_speed.x, flow_speed.y, r.y);
    f.limit    = mix(flow_limit.x, flow_limit.y, r.z);
    f.duration = flow_cycle * mix(0.7, 1.3, r.w);
    return f;
}


// fades out before a restart (by time or distance) and fades in after it
float flow_alpha(Flow f, float t, float dist) {
    if (t < 0.0) return 1.0;
    return min(
        min(smoothstep(0.0, flow_fade, t), smoothstep(f.duration, f.duration - flow_fade, t)),
        smoothstep(f.limit, 0.85 * f.limit, dist)
    );
}
