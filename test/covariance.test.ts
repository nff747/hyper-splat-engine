import { describe, it, expect } from 'vitest';
import { compute3DCovariance, project2DCovariance } from '../src/math/covariance';

describe('Gaussian Covariance Math', () => {
  it('computes symmetric 3D covariance from scale and unit quaternion', () => {
    const scale: [number, number, number] = [2.0, 1.0, 1.0];
    const rotation: [number, number, number, number] = [0, 0, 0, 1]; // Identity

    const cov = compute3DCovariance(scale, rotation);
    expect(cov.length).toBe(6);
    // Sigma_xx = 2^2 = 4
    expect(cov[0]).toBeCloseTo(4.0);
    // Off-diagonals = 0
    expect(cov[1]).toBeCloseTo(0.0);
    expect(cov[2]).toBeCloseTo(0.0);
    // Sigma_yy = 1
    expect(cov[3]).toBeCloseTo(1.0);
  });

  it('projects 3D covariance into 2D screen space with anti-aliasing filter', () => {
    const scale: [number, number, number] = [1.0, 1.0, 1.0];
    const rotation: [number, number, number, number] = [0, 0, 0, 1];
    const cov3D = compute3DCovariance(scale, rotation);

    const viewPos: [number, number, number] = [0, 0, 10]; // 10 units in front of camera
    const [cxx, cxy, cyy] = project2DCovariance(cov3D, viewPos, 1000, 1000);

    // Filter adds 0.3 low-pass pixel clamp
    expect(cxx).toBeGreaterThan(0.3);
    expect(cyy).toBeGreaterThan(0.3);
    expect(cxy).toBeCloseTo(0.0);
  });

  it('safely returns zero covariance for non-finite view positions or points behind camera', () => {
    const cov3D = new Float32Array(6);
    expect(project2DCovariance(cov3D, [0, 0, -5], 1000, 1000)).toEqual([0, 0, 0]);
    expect(project2DCovariance(cov3D, [NaN, 0, 10], 1000, 1000)).toEqual([0, 0, 0]);
    expect(project2DCovariance(cov3D, [0, 0, 10], 0, 1000)).toEqual([0, 0, 0]);
  });
});
