// psrdnoise (c) Stefan Gustavson and Ian McEwan, ver. 2021-12-02, MIT License
// https://github.com/stegu/psrdnoise


vec4 permute(vec4 i) {
    vec4 im = mod(i, 289.0);
    return mod(((im * 34.0) + 10.0) * im, 289.0);
}


float psrdnoise(vec3 x, vec3 period, float alpha, out vec3 gradient) {
    const mat3 M  = mat3(0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0);
    const mat3 Mi = mat3(-0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5);

    vec3 uvw = M * x;
    vec3 i0 = floor(uvw);
    vec3 f0 = fract(uvw);
    vec3 g_ = step(f0.xyx, f0.yzz);
    vec3 l_ = 1.0 - g_;
    vec3 g = vec3(l_.z, g_.xy);
    vec3 l = vec3(l_.xy, g_.z);
    vec3 o1 = min(g, l);
    vec3 o2 = max(g, l);
    vec3 i1 = i0 + o1;
    vec3 i2 = i0 + o2;
    vec3 i3 = i0 + vec3(1.0);

    vec3 v0 = Mi * i0;
    vec3 v1 = Mi * i1;
    vec3 v2 = Mi * i2;
    vec3 v3 = Mi * i3;

    vec3 x0 = x - v0;
    vec3 x1 = x - v1;
    vec3 x2 = x - v2;
    vec3 x3 = x - v3;

    if (any(greaterThan(period, vec3(0.0)))) {
        vec4 vx = vec4(v0.x, v1.x, v2.x, v3.x);
        vec4 vy = vec4(v0.y, v1.y, v2.y, v3.y);
        vec4 vz = vec4(v0.z, v1.z, v2.z, v3.z);
        if (period.x > 0.0) vx = mod(vx, period.x);
        if (period.y > 0.0) vy = mod(vy, period.y);
        if (period.z > 0.0) vz = mod(vz, period.z);
        i0 = floor(M * vec3(vx.x, vy.x, vz.x) + 0.5);
        i1 = floor(M * vec3(vx.y, vy.y, vz.y) + 0.5);
        i2 = floor(M * vec3(vx.z, vy.z, vz.z) + 0.5);
        i3 = floor(M * vec3(vx.w, vy.w, vz.w) + 0.5);
    }

    vec4 hash = permute(permute(permute(
                vec4(i0.z, i1.z, i2.z, i3.z))
              + vec4(i0.y, i1.y, i2.y, i3.y))
              + vec4(i0.x, i1.x, i2.x, i3.x));

    vec4 theta = hash * 3.883222077;
    vec4 sz    = hash * -0.006920415 + 0.996539792;
    vec4 psi   = hash * 0.108705628;

    vec4 Ct = cos(theta);
    vec4 St = sin(theta);
    vec4 sz_prime = sqrt(1.0 - sz * sz);

    vec4 gx, gy, gz;

    if (alpha != 0.0) {
        vec4 px = Ct * sz_prime;
        vec4 py = St * sz_prime;
        vec4 pz = sz;
        vec4 Sp = sin(psi);
        vec4 Cp = cos(psi);
        vec4 Ctp = St * Sp - Ct * Cp;
        vec4 qx = mix( Ctp * St, Sp, sz);
        vec4 qy = mix(-Ctp * Ct, Cp, sz);
        vec4 qz = -(py * Cp + px * Sp);
        vec4 Sa = vec4(sin(alpha));
        vec4 Ca = vec4(cos(alpha));
        gx = Ca * px + Sa * qx;
        gy = Ca * py + Sa * qy;
        gz = Ca * pz + Sa * qz;
    } else {
        gx = Ct * sz_prime;
        gy = St * sz_prime;
        gz = sz;
    }

    vec3 g0 = vec3(gx.x, gy.x, gz.x);
    vec3 g1 = vec3(gx.y, gy.y, gz.y);
    vec3 g2 = vec3(gx.z, gy.z, gz.z);
    vec3 g3 = vec3(gx.w, gy.w, gz.w);

    vec4 w = 0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3));
    w = max(w, 0.0);
    vec4 w2 = w * w;
    vec4 w3 = w2 * w;

    vec4 gdotx = vec4(dot(g0, x0), dot(g1, x1), dot(g2, x2), dot(g3, x3));

    float n = dot(w3, gdotx);

    vec4 dw = -6.0 * w2 * gdotx;
    vec3 dn0 = w3.x * g0 + dw.x * x0;
    vec3 dn1 = w3.y * g1 + dw.y * x1;
    vec3 dn2 = w3.z * g2 + dw.z * x2;
    vec3 dn3 = w3.w * g3 + dw.w * x3;
    gradient = 39.5 * (dn0 + dn1 + dn2 + dn3);

    return 39.5 * n;
}


// Bridson's curl noise: cross product of two noise gradients is divergence-free
vec3 curl(vec3 p, float alpha) {
    vec3 g1, g2;
    psrdnoise(p, vec3(0.0), alpha, g1);
    psrdnoise(p + vec3(31.4, -17.7, 9.2), vec3(0.0), alpha * 1.13 + 1.7, g2);
    return cross(g1, g2);
}
