/**
 * Zero-allocation persistent scratch memory pool for per-frame 3D Gaussian Splatting.
 * Prevents continuous typed array allocation and garbage-collector spikes during 60 FPS rendering.
 */

export class ScratchMemoryPool {
  private capacity: number;
  public depths: Float32Array;
  public indices: Uint32Array;
  public tempKeys: Uint32Array;
  public tempIndices: Uint32Array;

  constructor(initialCapacity: number = 65536) {
    this.capacity = initialCapacity;
    this.depths = new Float32Array(this.capacity);
    this.indices = new Uint32Array(this.capacity);
    this.tempKeys = new Uint32Array(this.capacity);
    this.tempIndices = new Uint32Array(this.capacity);
  }

  ensureCapacity(requiredCapacity: number): void {
    if (requiredCapacity <= this.capacity) return;

    // Grow geometrically (1.5x) to prevent frequent re-allocations
    let newCapacity = Math.max(requiredCapacity, Math.floor(this.capacity * 1.5));
    this.capacity = newCapacity;

    this.depths = new Float32Array(newCapacity);
    this.indices = new Uint32Array(newCapacity);
    this.tempKeys = new Uint32Array(newCapacity);
    this.tempIndices = new Uint32Array(newCapacity);
  }

  getCapacity(): number {
    return this.capacity;
  }
}
