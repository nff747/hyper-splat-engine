/**
 * 3D Gaussian Covariance computation and projection to 2D screen space.
 * Follows the EWA (Elliptical Weighted Average) splatting model.
 */

export function compute3DCovariance(
  scale: [number, number, number],
  rotation: [number, number, number, number]
): Float32Array {
  const [sx, sy, sz] = scale;
  const [qx, qy, qz, qw] = rotation;

  // Rotation matrix from unit quaternion
  const r00 = 1.0 - 2.0 * (qy * qy + qz * qz);
  const r01 = 2.0 * (qx * qy - qz * qw);
  const r02 = 2.0 * (qx * qz + qy * qw);

  const r10 = 2.0 * (qx * qy + qz * qw);
  const r11 = 1.0 - 2.0 * (qx * qx + qz * qz);
  const r12 = 2.0 * (qy * qz - qx * qw);

  const r20 = 2.0 * (qx * qz - qy * qw);
  const r21 = 2.0 * (qy * qz + qx * qw);
  const r22 = 1.0 - 2.0 * (qx * qx + qy * qy);

  // M = R * S
  const m00 = r00 * sx, m01 = r01 * sy, m02 = r02 * sz;
  const m10 = r10 * sx, m11 = r11 * sy, m12 = r12 * sz;
  const m20 = r20 * sx, m21 = r21 * sy, m22 = r22 * sz;

  // Covariance Sigma = M * M^T (symmetric 3x3, 6 unique elements)
  const cov = new Float32Array(6);
  cov[0] = m00 * m00 + m01 * m01 + m02 * m02; // Sigma_xx
  cov[1] = m00 * m10 + m01 * m11 + m02 * m12; // Sigma_xy
  cov[2] = m00 * m20 + m01 * m21 + m02 * m22; // Sigma_xz
  cov[3] = m10 * m10 + m11 * m11 + m12 * m12; // Sigma_yy
  cov[4] = m10 * m20 + m11 * m21 + m12 * m22; // Sigma_yz
  cov[5] = m20 * m20 + m21 * m21 + m22 * m22; // Sigma_zz

  return cov;
}

/**
 * Projects 3D covariance into 2D screen space: Sigma' = J * W * Sigma * W^T * J^T
 * Returns 2D covariance upper triangle: [cov2D_xx, cov2D_xy, cov2D_yy].
 */
export function project2DCovariance(
  cov3D: Float32Array,
  viewPos: [number, number, number],
  focalX: number,
  focalY: number
): [number, number, number] {
  const [tx, ty, tz] = viewPos;
  // Security & Stability Guard: Reject non-finite or degenerate near/behind camera positions
  if (!Number.isFinite(tx) || !Number.isFinite(ty) || !Number.isFinite(tz) || tz <= 1e-4) {
    return [0, 0, 0];
  }
  if (!Number.isFinite(focalX) || !Number.isFinite(focalY) || focalX <= 0 || focalY <= 0) {
    return [0, 0, 0];
  }

  const invZ = 1.0 / tz;
  const invZ2 = invZ * invZ;

  // Jacobian of perspective projection J
  const j00 = focalX * invZ;
  const j02 = -focalX * tx * invZ2;
  const j11 = focalY * invZ;
  const j12 = -focalY * ty * invZ2;

  // 2D Covariance with low-pass filter (0.3 pixel anti-aliasing kernel)
  const c00 = cov3D[0], c01 = cov3D[1], c02 = cov3D[2];
  const c11 = cov3D[3], c12 = cov3D[4], c22 = cov3D[5];

  const cov2D_xx = j00 * (j00 * c00 + j02 * c02) + j02 * (j00 * c02 + j02 * c22) + 0.3;
  const cov2D_xy = j00 * (j11 * c01 + j12 * c02) + j02 * (j11 * c12 + j12 * c22);
  const cov2D_yy = j11 * (j11 * c11 + j12 * c12) + j12 * (j11 * c12 + j12 * c22) + 0.3;

  return [cov2D_xx, cov2D_xy, cov2D_yy];
}
