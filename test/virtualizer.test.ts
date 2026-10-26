import { describe, it, expect } from 'vitest';
import { VRAMVirtualizer } from '../src/streaming/VRAMVirtualizer';
import { SplatChunkDescriptor } from '../src/core/types';

describe('VRAMVirtualizer', () => {
  it('manages resident VRAM footprint and plans evictions under memory pressure', () => {
    // 100 MB budget
    const virtualizer = new VRAMVirtualizer(100 * 1024 * 1024);

    const chunkA: SplatChunkDescriptor = {
      chunkId: 1,
      splatCount: 100000,
      byteOffset: 0,
      byteLength: 40 * 1024 * 1024, // 40 MB
      lodLevel: 0,
      isResident: false,
    };

    const chunkB: SplatChunkDescriptor = {
      chunkId: 2,
      splatCount: 100000,
      byteOffset: 0,
      byteLength: 50 * 1024 * 1024, // 50 MB
      lodLevel: 0,
      isResident: false,
    };

    virtualizer.registerChunk(chunkA);
    virtualizer.registerChunk(chunkB);

    virtualizer.markResident(1); // 40 MB
    virtualizer.markResident(2); // 90 MB total

    expect(virtualizer.getAllocatedBytes()).toBe(90 * 1024 * 1024);

    // Incoming 30 MB chunk (would total 120 MB > 100 MB limit)
    // Needs 20 MB reclaimed -> should evict chunk 1 (oldest accessed)
    const evictionPlan = virtualizer.planEviction(30 * 1024 * 1024);
    expect(evictionPlan).toEqual([1]);

    virtualizer.markEvicted(1);
    expect(virtualizer.getAllocatedBytes()).toBe(50 * 1024 * 1024);
  });

  it('accounts for in-flight reservations to prevent TOCTOU race conditions', () => {
    const virtualizer = new VRAMVirtualizer(100 * 1024 * 1024);
    virtualizer.registerChunk({
      chunkId: 1,
      splatCount: 50000,
      byteOffset: 0,
      byteLength: 40 * 1024 * 1024,
      lodLevel: 0,
      isResident: false,
    });
    virtualizer.markResident(1); // 40 MB active
    expect(virtualizer.getAllocatedBytes()).toBe(40 * 1024 * 1024);

    // Reserve 50 MB for async chunk in-flight -> 90 MB committed+reserved
    virtualizer.reserveMemory(50 * 1024 * 1024);
    expect(virtualizer.getReservedBytes()).toBe(50 * 1024 * 1024);

    // Another concurrent 20 MB request arrives -> 90 + 20 = 110 MB > 100 MB
    // Should trigger eviction for chunk 1 even though chunk 2 isn't fully uploaded yet
    const plan = virtualizer.planEviction(20 * 1024 * 1024);
    expect(plan).toEqual([1]);

    // Commit reservation
    virtualizer.commitReservation(2, 50 * 1024 * 1024);
    expect(virtualizer.getReservedBytes()).toBe(0);
  });
});
