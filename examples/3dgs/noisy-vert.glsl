#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;
precision highp usampler2D;


uniform uint splats_count;

uniform sampler2D position_map;
uniform sampler2D state_map;
uniform sampler2D scale_map;
uniform sampler2D rotation_map;
uniform sampler2D color_map;
uniform usampler2D order_map;

uniform vec2 viewport;
uniform mat4 matrix_model;
uniform mat4 matrix_view;
uniform mat4 matrix_projection;

//#include flow


struct SplatSource {
    uint order;         
    uint id;            
    ivec2 uv;           
    vec2 cornerUV;      
};


struct SplatCenter {
    vec3 view;          
    vec4 proj;          
    mat4 modelView;     
    float projMat00;    
    vec3 modelCenterOriginal;   
    vec3 modelCenterModified;   
};


struct SplatCorner {
    vec2 offset;        
    vec2 uv;            
    vec2 v;
    float dlen;
};


bool initSource(out SplatSource source) {
    source.order = uint(gl_InstanceID);
    if (source.order >= splats_count) {
        return false;
    }

    uint w = uint(textureSize(order_map, 0).x);
    ivec2 orderUV = ivec2(source.order % w, source.order / w);

    source.id = texelFetch(order_map, orderUV, 0).r;
    source.uv = ivec2(source.id % w, source.id / w);
    source.cornerUV = vec2[](vec2(-1,-1), vec2(1,-1), vec2(-1,1), vec2(1,1))[gl_VertexID];

    return true;
}


vec3 readCenter(SplatSource source) {
    vec4 pos = texelFetch(position_map, source.uv, 0);
    return pos.xyz;
}


mat3 quatToMat3(vec4 R) {
    vec4 R2 = R + R;
    float X = R2.x * R.w;
    vec4 Y  = R2.y * R;
    vec4 Z  = R2.z * R;
    float W = R2.w * R.w;

    return mat3(
        1.0 - Z.z - W,
              Y.z + X,
              Y.w - Z.x,
              Y.z - X,
        1.0 - Y.y - W,
              Z.w + Y.x,
              Y.w + Z.x,
              Z.w - Y.x,
        1.0 - Y.y - Z.z
    );
}



void readCovariance(in SplatSource source, out vec3 covA, out vec3 covB) {
    vec4 tR = texelFetch(rotation_map, source.uv, 0);
    vec4 tS = texelFetch(scale_map, source.uv, 0);

    mat3 rot = quatToMat3(tR.wxyz);
    vec3 scale = tS.xyz;


    mat3 M = transpose(mat3(
        scale.x * rot[0],
        scale.y * rot[1],
        scale.z * rot[2]
    ));

    covA = vec3(dot(M[0], M[0]), dot(M[0], M[1]), dot(M[0], M[2]));
    covB = vec3(dot(M[1], M[1]), dot(M[1], M[2]), dot(M[2], M[2]));
}





bool initCenter(SplatSource source, vec3 modelCenter, out SplatCenter center) {
    mat4 modelView = matrix_view * matrix_model;
    vec4 centerView = modelView * vec4(modelCenter, 1.0);
    vec4 centerProj = matrix_projection * centerView;
    // world-hand independent check
    if (centerProj.w <= 0.0) return false;

    centerProj.z = clamp(centerProj.z, -abs(centerProj.w), abs(centerProj.w));

    center.view = centerView.xyz / centerView.w;
    center.proj = centerProj;
    center.projMat00 = matrix_projection[0][0];
    center.modelView = modelView;
    return true;
}


bool initCornerCov(SplatSource source, SplatCenter center, out SplatCorner corner, vec3 covA, vec3 covB) {

    mat3 Vrk = mat3(
        covA.x, covA.y, covA.z, 
        covA.y, covB.x, covB.y,
        covA.z, covB.y, covB.z
    );

    float focal = 0.5 * viewport.x * center.projMat00;

    vec3 v = center.view.xyz;
    float J1 = focal / v.z;
    vec2 J2 = -J1 / v.z * v.xy;
    mat3 J = mat3(
        J1, 0.0, J2.x, 
        0.0, J1, J2.y, 
        0.0, 0.0, 0.0
    );

    mat3 W = transpose(mat3(center.modelView));
    mat3 T = W * J;
    mat3 cov = transpose(T) * Vrk * T;


    float diagonal1 = cov[0][0] + 0.3;
    float offDiagonal = cov[0][1];
    float diagonal2 = cov[1][1] + 0.3;

    float mid = 0.5 * (diagonal1 + diagonal2);
    float radius = length(vec2((diagonal1 - diagonal2) / 2.0, offDiagonal));
    float lambda1 = mid + radius;
    float lambda2 = max(mid - radius, 0.1);


    float vmin = min(1024.0, min(viewport.x, viewport.y));

    float l1 = 2.0 * min(sqrt(2.0 * lambda1), vmin);
    float l2 = 2.0 * min(sqrt(2.0 * lambda2), vmin);


    if (l1 < 2.0 && l2 < 2.0) {
        return false;
    }

    vec2 c = 2.0 * center.proj.ww / viewport;


    if (any(greaterThan(abs(center.proj.xy) - vec2(max(l1, l2)) * c, center.proj.ww))) {
        return false;
    }

    vec2 d = vec2(offDiagonal, lambda1 - diagonal1);
    vec2 diagonalVector = dot(d, d) > 1e-12 ? normalize(d) : vec2(1.0, 0.0);
    vec2 v1 = l1 * diagonalVector;
    vec2 v2 = l2 * vec2(diagonalVector.y, -diagonalVector.x);

    corner.offset = (source.cornerUV.x * v1 + source.cornerUV.y * v2) * c;
    corner.uv = source.cornerUV;

    return true;
}


bool initCorner(SplatSource source, SplatCenter center, out SplatCorner corner) {
    vec3 covA, covB;
    readCovariance(source, covA, covB);
    return initCornerCov(source, center, corner, covA, covB);
}


void clipCorner(inout SplatCorner corner, float alpha) {
    float clip = min(1.0, sqrt(-log(1.0 / (255.0 * alpha))) / 2.0);
    corner.offset *= clip;
    corner.uv *= clip;
}


vec4 readColor(in SplatSource source) {
    return texelFetch(color_map, source.uv, 0);
}

     
flat out vec4 color;
out vec2 uv;

mediump vec4 discardVec = vec4(0.0, 0.0, 2.0, 1.0);


void main(void) {

    SplatSource source;
    if (!initSource(source)) {
        gl_Position = discardVec;
        return;
    }

    vec3 origin = readCenter(source);
    vec4 state = texelFetch(state_map, source.uv, 0);
    vec3 modelCenter = state.xyz;

    SplatCenter center;
    if (!initCenter(source, modelCenter, center)) {
        gl_Position = discardVec;
        return;
    }

    color = clamp(readColor(source), 0.0, 1.0);
    color.a *= flow_alpha(flow_params(source.id), state.w, distance(modelCenter, origin));
    if (color.a < 1.0 / 255.0) {
      gl_Position = discardVec;
      return;
    }

    SplatCorner corner;
    if (!initCorner(source, center, corner)) {
        gl_Position = discardVec;
        return;
    }

    clipCorner(corner, color.w);

    gl_Position = center.proj + vec4(corner.offset, 0.0, 0.0);
    uv = corner.uv;
}
