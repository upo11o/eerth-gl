import { abs, cos, DEG2RAD, sin, sqrt, tan } from "./math"


const id_mat4 = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
])

/** allocates new Float32Array */
export const new_mat4 = (from: NumberArray = id_mat4): Float32Array => new Float32Array(from)

/** creates Float32Array view */
export const new_mat4_from_buffer = (buf: ArrayBuffer, byte_offset: number): Float32Array => {
  const m = new Float32Array(buf, byte_offset, 16)
  mat4_identify(m)
  return m
}

export const mat4_identify = (m: NumberArray): void => {
  m.fill(0)
  m[0] = m[5] = m[10] = m[15] = 1
}


/** composes mat4 from Euler rotation, position, scale */
export const mat4_compose_prs = (
  m: NumberArray,
  px: number, py: number, pz: number,
  rx: number, ry: number, rz: number,
  sx: number, sy: number, sz: number,
): void => {
  m.fill(0)
  const
    cosx = cos(rx), sinx = sin(rx),
    cosy = cos(ry), siny = sin(ry),
    cosz = cos(rz), sinz = sin(rz),
    cosxz = cosx * cosz,
    sinxz = sinx * sinz,
    cosxsinz = cosx * sinz,
    sinxcosz = sinx * cosz
  m[0] = cosy * cosz * sx
  m[1] = (cosxsinz + sinxcosz * siny) * sx
  m[2] = (sinxz - cosxz * siny) * sx
  m[4] = (-cosy * sinz) * sy
  m[5] = (cosxz - sinxz * siny) * sy
  m[6] = (sinxcosz + cosxsinz * siny) * sy
  m[8] = siny * sz
  m[9] = (-sinx * cosy) * sz
  m[10] = (cosx * cosy) * sz
  m[12] = px
  m[13] = py
  m[14] = pz
  m[15] = 1
}


/** composes mat4 from Euler XY-rotation, uniform scale */
export const mat4_compose_rxy_scl = (
  m: NumberArray,
  rx: number, ry: number,
  scale: number,
): void => {
  m.fill(0)
  const
    cosx = cos(rx), sinx = sin(rx),
    cosy = cos(ry), siny = sin(ry)
  m[0] =  cosy        * scale
  m[1] =  sinx * siny * scale
  m[2] = -cosx * siny * scale
  m[5] =  cosx        * scale
  m[6] =  sinx        * scale
  m[8] =  siny        * scale
  m[9] = -sinx * cosy * scale
  m[10] = cosx * cosy * scale
  m[15] = 1
}


/** composes mat4 from position, scale */
export const mat4_compose_ps = (
  m: NumberArray,
  px: number, py: number, pz: number,
  sx: number, sy: number, sz: number,
): void => {
  m.fill(0)
  m[0]  = sx; m[5]  = sy; m[10] = sz
  m[12] = px; m[13] = py; m[14] = pz
  m[15] = 1
}


/** composes mat4 from quaternion, position, scale */
export const mat4_compose_pqs = (
  m: NumberArray,
  q: NumberArray,
  px: number, py: number, pz: number,
  sx: number, sy: number, sz: number,
): void => {
  m.fill(0)
  const x = q[0], y = q[1], z = q[2], w = q[3]
  const x2 = x + x,	y2 = y + y, z2 = z + z
  const xx = x * x2, xy = x * y2, xz = x * z2
  const yy = y * y2, yz = y * z2, zz = z * z2
  const wx = w * x2, wy = w * y2, wz = w * z2
  m[0] =  (1 - yy - zz) * sx
  m[1] =  (xy + wz)     * sx
  m[2] =  (xz - wy)     * sx
  m[4] =  (xy - wz)     * sy
  m[5] =  (1 - xx - zz) * sy
  m[6] =  (yz + wx)     * sy
  m[8] =  (xz + wy)     * sz
  m[9] =  (yz - wx)     * sz
  m[10] = (1 - xx - yy) * sz
  m[12] = px
  m[13] = py
  m[14] = pz
  m[15] = 1
}


export const mat4_set_pos = (m: NumberArray, x: number, y: number, z: number): void => {
  m[12] = x; m[13] = y; m[14] = z
}

/** movement along global X-axis */
export const mat4_mov_gx = (m: NumberArray, dx: number): void => {
  m[12] += dx
}

/** movement along global Y-axis */
export const mat4_mov_gy = (m: NumberArray, dy: number): void => {
  m[13] += dy
}

/** movement along global Z-axis */
export const mat4_mov_gz = (m: NumberArray, dz: number): void => {
  m[14] += dz
}

/** movement along global XYZ-axises */
export const mat4_movg = (m: NumberArray, x: number, y: number, z: number): void => {
  m[12] += x; m[13] += y; m[14] += z
}

/** movement along local XYZ-axises */
export const mat4_movl = (m: NumberArray, x: number, y: number, z: number): void => {
  m[12] += x * m[0] + y * m[4] + z * m[8]
  m[13] += x * m[1] + y * m[5] + z * m[9]
  m[14] += x * m[2] + y * m[6] + z * m[10]
}

/** movement along local X-axis */
export const mat4_mov_lx = (m: NumberArray, x: number): void => {
  m[12] += x * m[0]; m[13] += x * m[1]; m[14] += x * m[2]
}

/** movement along local Y-axis */
export const mat4_mov_ly = (m: NumberArray, y: number): void => {
  m[12] += y * m[4]; m[13] += y * m[5]; m[14] += y * m[6]
}

/** movement along local Z-axis */
export const mat4_mov_lz = (m: NumberArray, z: number): void => {
  m[12] += z * m[8]; m[13] += z * m[9]; m[14] += z * m[10]
}

/** uniform local scale */
export const mat4_scl = (m: NumberArray, s: number): void => {
  m[0] *= s; m[1] *= s; m[2]  *= s
  m[4] *= s; m[5] *= s; m[6]  *= s
  m[8] *= s; m[9] *= s; m[10] *= s
}

/** scale along local XYZ-axises */
export const mat4_scl_xyz = (m: NumberArray, x: number, y: number, z: number): void => {
  m[0] *= x; m[1] *= x; m[2]  *= x
  m[4] *= y; m[5] *= y; m[6]  *= y
  m[8] *= z; m[9] *= z; m[10] *= z
}

/** scale along local X-axis */
export const mat4_scl_x = (m: NumberArray, s: number): void => {
  m[0] *= s; m[1] *= s; m[2] *= s
}

/** scale along local Y-axis */
export const mat4_scl_y = (m: NumberArray, s: number): void => {
  m[4] *= s; m[5] *= s; m[6] *= s
}

/** scale along local Z-axis */
export const mat4_scl_z = (m: NumberArray, s: number): void => {
  m[8] *= s; m[9] *= s; m[10] *= s
}

/** local rotation around local X-axis */
export const mat4_rot_lx = (m: NumberArray, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m4 = m[4], m5 = m[5], m6 = m[6],
    m8 = m[8], m9 = m[9], ma = m[10]
  m[4] = c * m4 + s * m8; m[8]  = c * m8 - s * m4
  m[5] = c * m5 + s * m9; m[9]  = c * m9 - s * m5
  m[6] = c * m6 + s * ma; m[10] = c * ma - s * m6
}

/** local rotation around local Y-axis */
export const mat4_rot_ly = (m: NumberArray, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m0 = m[0], m1 = m[1], m2 = m[2],
    m8 = m[8], m9 = m[9], ma = m[10]
  m[0] = c * m0 - s * m8; m[8]  = c * m8 + s * m0
  m[1] = c * m1 - s * m9; m[9]  = c * m9 + s * m1
  m[2] = c * m2 - s * ma; m[10] = c * ma + s * m2
}

/** local rotation around local Z-axis */
export const mat4_rot_lz = (m: NumberArray, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m0 = m[0], m1 = m[1], m2 = m[2],
    m4 = m[4], m5 = m[5], m6 = m[6]
  m[0] = c * m0 + s * m4; m[4] = c * m4 - s * m0
  m[1] = c * m1 + s * m5; m[5] = c * m5 - s * m1
  m[2] = c * m2 + s * m6; m[6] = c * m6 - s * m2
}

/** local rotation around global X-axis */
export const mat4_rot_gx = (m: NumberArray, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m1 = m[1], m5 = m[5], m9 = m[9],
    m2 = m[2], m6 = m[6], ma = m[10]
  m[1]  = m1 * c - m2 * s; m[2]  = m2 * c + m1 * s
  m[5]  = m5 * c - m6 * s; m[6]  = m6 * c + m5 * s
  m[9]  = m9 * c - ma * s; m[10] = ma * c + m9 * s
}

/** local rotation around global Y-axis */
export const mat4_rot_gy = (m: NumberArray, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m0 = m[0], m4 = m[4], m8 = m[8],
    m2 = m[2], m6 = m[6], ma = m[10]
  m[0]  = m0 * c + m2 * s; m[2]  = m2 * c - m0 * s
  m[4]  = m4 * c + m6 * s; m[6]  = m6 * c - m4 * s
  m[8]  = m8 * c + ma * s; m[10] = ma * c - m8 * s
}

/** local rotation around global Z-axis */
export const mat4_rot_gz = (m: NumberArray, a: number): void => {
  const
    c = cos(a),
    s = sin(a),
    m0 = m[0], m4 = m[4], m8 = m[8],
    m1 = m[1], m5 = m[5], m9 = m[9]
  m[0]  = m0 * c - m1 * s; m[1] = m1 * c + m0 * s
  m[4]  = m4 * c - m5 * s; m[5] = m5 * c + m4 * s
  m[8]  = m8 * c - m9 * s; m[9] = m9 * c + m8 * s
}

/** sets rotation around Z-axis for identity mat4 */
export const mat4_set_rot_z = (m: NumberArray, a: number): void => {
  const c = cos(a), s = sin(a)
  m[0] = c; m[1] = s; m[5] = c; m[4] = -s
}

/** sets rotation around Y-axis for identity mat4 */
export const mat4_set_rot_y = (m: NumberArray, a: number): void => {
  const c = cos(a), s = sin(a)
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c
}


/** T = A • B, skips [3,7,11,15] elements */
export const mat4_mult = (a: NumberArray, b: NumberArray, t = a): void => {
  const b00 = b[0],  b01 = b[1],  b02 = b[2]
  const b10 = b[4],  b11 = b[5],  b12 = b[6]
  const b20 = b[8],  b21 = b[9],  b22 = b[10]
  const b30 = b[12], b31 = b[13], b32 = b[14]

  const a00 = a[0],  a01 = a[1],  a02 = a[2]
  const a10 = a[4],  a11 = a[5],  a12 = a[6]
  const a20 = a[8],  a21 = a[9],  a22 = a[10]
  const a30 = a[12], a31 = a[13], a32 = a[14]

  t[0]  = b00 * a00 + b01 * a10 + b02 * a20
  t[1]  = b00 * a01 + b01 * a11 + b02 * a21
  t[2]  = b00 * a02 + b01 * a12 + b02 * a22
  t[4]  = b10 * a00 + b11 * a10 + b12 * a20
  t[5]  = b10 * a01 + b11 * a11 + b12 * a21
  t[6]  = b10 * a02 + b11 * a12 + b12 * a22
  t[8]  = b20 * a00 + b21 * a10 + b22 * a20
  t[9]  = b20 * a01 + b21 * a11 + b22 * a21
  t[10] = b20 * a02 + b21 * a12 + b22 * a22
  t[12] = b30 * a00 + b31 * a10 + b32 * a20 + a30
  t[13] = b30 * a01 + b31 * a11 + b32 * a21 + a31
  t[14] = b30 * a02 + b31 * a12 + b32 * a22 + a32
}


/** T = A • B */
export const mat4_mult_full = (a: NumberArray, b: NumberArray, t = a): void => {
  const b00 = b[0],  b01 = b[1],  b02 = b[2],  b03 = b[3]
  const b10 = b[4],  b11 = b[5],  b12 = b[6],  b13 = b[7]
  const b20 = b[8],  b21 = b[9],  b22 = b[10], b23 = b[11]
  const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15]

  const a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3]
  const a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7]
  const a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11]
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15]

  t[0]  = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30
  t[1]  = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31
  t[2]  = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32
  t[3]  = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33
  t[4]  = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30
  t[5]  = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31
  t[6]  = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32
  t[7]  = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33
  t[8]  = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30
  t[9]  = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31
  t[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32
  t[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33
  t[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30
  t[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31
  t[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32
  t[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
}


export const mat4_set_orthographic_projection = (
  m: NumberArray,
  width: number,
  height: number,
  near: number,
  far: number,
  webgpu = false,
  left_hand = true,
): void => {
  const sign = left_hand ? 1 : -1
  const inv_range = 1 / (far - near)
  m[0]  = 2 / width
  m[5]  = 2 / height
  m[10] = sign * (webgpu ? 1 : 2) * inv_range
  m[14] = (webgpu ? -near : -far - near) * inv_range
}


export const mat4_set_perspective_projection = (
  m: NumberArray,
  fov: number,
  aspect: number,
  near: number,
  far: number,
  webgpu = false,
  left_hand = true,
): void => {
  m.fill(0)
  const sign = left_hand ? 1 : -1
  const f = 1 / tan(fov * DEG2RAD / 2)
  const inv_range = 1 / (far - near)
  m[0]  = f / aspect
  m[5]  = f
  m[10] = sign * (webgpu ? far : far + near) * inv_range
  m[11] = sign
  m[14] = (webgpu ? -1 : -2) * far * near * inv_range
}


export const mat4_look_at = (
  m: NumberArray,
  tx: number,
  ty: number,
  tz: number,
  backward = false,
  upx = 0,
  upy = 1,
  upz = 0,
): void => {

  // z forward vector
  let zx: number, zy: number, zz: number

  if (backward) {
    zx = m[12] - tx
    zy = m[13] - ty
    zz = m[14] - tz
  } else {
    zx = tx - m[12]
    zy = ty - m[13]
    zz = tz - m[14]
  }

  let zl = zx * zx + zy * zy + zz * zz
  if (zl === 0) {
    // eye and target are in the same position
    zz = 1
  }
  zl = 1 / sqrt(zx * zx + zy * zy + zz * zz)
  zx *= zl; zy *= zl; zz *= zl

  // cross up × z = x
  let
    xx = upy * zz - upz * zy,
    xy = upz * zx - upx * zz,
    xz = upx * zy - upy * zx

  let xl = xx * xx + xy * xy + xz * xz

  if (xl === 0) {
    // up and z are parallel
    if (abs(upz) === 1) {
      zx += 0.0001
    } else {
      zz += 0.0001
    }
    zl = 1 / sqrt(zx * zx + zy * zy + zz * zz)
    zx *= zl; zy *= zl; zz *= zl
    xx = upy * zz - upz * zy
    xy = upz * zx - upx * zz
    xz = upx * zy - upy * zx
    xl = 1 / sqrt(xx * xx + xy * xy + xz * xz)
  } else {
    xl = 1 / sqrt(xl)
  }
  xx *= xl; xy *= xl; xz *= xl

  // cross z × x = y
  const
    yx = zy * xz - zz * xy,
    yy = zz * xx - zx * xz,
    yz = zx * xy - zy * xx

  m[0] = xx; m[1] = xy; m[2]  = xz
  m[4] = yx; m[5] = yy; m[6]  = yz
  m[8] = zx; m[9] = zy; m[10] = zz
}


export const mat4_invert = (m: NumberArray, out = m): void => {

  const
		n11 = m[0],  n21 = m[1],  n31 = m[2],  n41 = m[3],
		n12 = m[4],  n22 = m[5],  n32 = m[6],  n42 = m[7],
		n13 = m[8],  n23 = m[9],  n33 = m[10], n43 = m[11],
		n14 = m[12], n24 = m[13], n34 = m[14], n44 = m[15],

		t01 = n11 * n22 - n21 * n12,
		t02 = n11 * n32 - n31 * n12,
		t03 = n11 * n42 - n41 * n12,
		t04 = n21 * n32 - n31 * n22,
		t05 = n21 * n42 - n41 * n22,
		t06 = n31 * n42 - n41 * n32,
		t07 = n13 * n24 - n23 * n14,
		t08 = n13 * n34 - n33 * n14,
		t09 = n13 * n44 - n43 * n14,
		t10 = n23 * n34 - n33 * n24,
		t11 = n23 * n44 - n43 * n24,
		t12 = n33 * n44 - n43 * n34

  const det = t01 * t12 - t02 * t11 + t03 * t10 + t04 * t09 - t05 * t08 + t06 * t07

  if (det === 0) {
    out.fill(0)
    return
  }

  const det_inv = 1 / det

  out[0]  = (n22 * t12 - n32 * t11 + n42 * t10) * det_inv
  out[1]  = (n31 * t11 - n21 * t12 - n41 * t10) * det_inv
  out[2]  = (n24 * t06 - n34 * t05 + n44 * t04) * det_inv
  out[3]  = (n33 * t05 - n23 * t06 - n43 * t04) * det_inv

  out[4]  = (n32 * t09 - n12 * t12 - n42 * t08) * det_inv
  out[5]  = (n11 * t12 - n31 * t09 + n41 * t08) * det_inv
  out[6]  = (n34 * t03 - n14 * t06 - n44 * t02) * det_inv
  out[7]  = (n13 * t06 - n33 * t03 + n43 * t02) * det_inv

  out[8]  = (n12 * t11 - n22 * t09 + n42 * t07) * det_inv
  out[9]  = (n21 * t09 - n11 * t11 - n41 * t07) * det_inv
  out[10] = (n14 * t05 - n24 * t03 + n44 * t01) * det_inv
  out[11] = (n23 * t03 - n13 * t05 - n43 * t01) * det_inv

  out[12] = (n22 * t08 - n12 * t10 - n32 * t07) * det_inv
  out[13] = (n11 * t10 - n21 * t08 + n31 * t07) * det_inv
  out[14] = (n24 * t02 - n14 * t04 - n34 * t01) * det_inv
  out[15] = (n13 * t04 - n23 * t02 + n33 * t01) * det_inv
}


export const mat4_determinant = (m: NumberArray): number => {
  const n11 = m[0], n12 = m[4], n13 = m[8],  n14 = m[12]
  const n21 = m[1], n22 = m[5], n23 = m[9],  n24 = m[13]
  const n31 = m[2], n32 = m[6], n33 = m[10], n34 = m[14]
  const n41 = m[3], n42 = m[7], n43 = m[11], n44 = m[15]

  const t11 = n23 * n34 - n24 * n33
  const t12 = n22 * n34 - n24 * n32
  const t13 = n22 * n33 - n23 * n32

  const t21 = n21 * n34 - n24 * n31
  const t22 = n21 * n33 - n23 * n31
  const t23 = n21 * n32 - n22 * n31

  return n11 * (n42 * t11 - n43 * t12 + n44 * t13) -
			   n12 * (n41 * t11 - n43 * t21 + n44 * t22) +
			   n13 * (n41 * t12 - n42 * t21 + n44 * t23) -
			   n14 * (n41 * t13 - n42 * t22 + n43 * t23)
}
