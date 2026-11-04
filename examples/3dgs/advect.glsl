#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;


uniform sampler2D state_map;
uniform sampler2D position_map;
uniform uint  loaded_count;
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

    uint id = uint(uv.y * textureSize(state_map, 0).x + uv.x);
    if (id >= loaded_count) {
        State = s;
        return;
    }

    vec3 p0 = texelFetch(position_map, uv, 0).xyz;
    Flow f = flow_params(id);

    vec3 p = s.xyz;
    float t = s.w;

    // first frame after load: start a cycle as a soft splat
    if (t < 0.0) {
        p = p0;
        t = 0.0;
    }

    t += dt;
    p += curl(p * flow_freq, flow_time * flow_evolve) * f.speed * dt;

    if (t > f.limit) {
        p = p0;
        t = 0.0;
    }

    State = vec4(p, t);
}
