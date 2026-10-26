import { describe, it, expect } from 'vitest';
import { sortSplatsByDepth } from '../src/math/sorting';

describe('Splat Depth Radix Sort', () => {
  it('correctly sorts splats in back-to-front descending order for alpha blending', () => {
    const depths = new Float32Array([1.5, 10.2, 0.4, 5.8, 20.1]);
    const indices = new Uint32Array([0, 1, 2, 3, 4]);

    // Back-to-front: descending depth
    sortSplatsByDepth(depths, indices, false);

    const sortedDepths = Array.from(indices).map(idx => depths[idx]);
    expect(sortedDepths[0]).toBeCloseTo(20.1);
    expect(sortedDepths[1]).toBeCloseTo(10.2);
    expect(sortedDepths[2]).toBeCloseTo(5.8);
    expect(sortedDepths[3]).toBeCloseTo(1.5);
    expect(sortedDepths[4]).toBeCloseTo(0.4);
  });

  it('correctly sorts splats in front-to-back ascending order', () => {
    const depths = new Float32Array([1.5, 10.2, 0.4, 5.8, 20.1]);
    const indices = new Uint32Array([0, 1, 2, 3, 4]);

    sortSplatsByDepth(depths, indices, true);

    const sortedDepths = Array.from(indices).map(idx => depths[idx]);
    expect(sortedDepths[0]).toBeCloseTo(0.4);
    expect(sortedDepths[1]).toBeCloseTo(1.5);
    expect(sortedDepths[2]).toBeCloseTo(5.8);
    expect(sortedDepths[3]).toBeCloseTo(10.2);
    expect(sortedDepths[4]).toBeCloseTo(20.1);
  });
});
