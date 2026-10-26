import { describe, it, expect } from 'vitest';
import { ScratchMemoryPool } from '../src/core/ScratchMemoryPool';

describe('ScratchMemoryPool', () => {
  it('initializes with capacity and grows geometrically without memory fragmentation', () => {
    const pool = new ScratchMemoryPool(1024);
    expect(pool.getCapacity()).toBe(1024);
    expect(pool.depths.length).toBe(1024);
    expect(pool.indices.length).toBe(1024);

    // Requesting smaller capacity should not reallocate
    pool.ensureCapacity(500);
    expect(pool.getCapacity()).toBe(1024);

    // Requesting larger capacity triggers 1.5x expansion
    pool.ensureCapacity(2000);
    expect(pool.getCapacity()).toBeGreaterThanOrEqual(2000);
    expect(pool.depths.length).toBe(pool.getCapacity());
    expect(pool.indices.length).toBe(pool.getCapacity());
  });
});
