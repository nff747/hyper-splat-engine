import { SplatChunkDescriptor } from '../core/types';

export class VRAMVirtualizer {
  private maxVramBytes: number;
  private currentAllocatedBytes: number = 0;
  private chunks: Map<number, SplatChunkDescriptor> = new Map();
  private lruAccessList: number[] = []; // Chunk IDs in access order

  constructor(maxVramBytes: number = 512 * 1024 * 1024) {
    this.maxVramBytes = maxVramBytes;
  }

  registerChunk(chunk: SplatChunkDescriptor): void {
    this.chunks.set(chunk.chunkId, chunk);
  }

  touchChunk(chunkId: number): void {
    const idx = this.lruAccessList.indexOf(chunkId);
    if (idx !== -1) {
      this.lruAccessList.splice(idx, 1);
    }
    this.lruAccessList.push(chunkId);
  }

  /**
   * Evaluates memory pressure and determines which chunks must be evicted
   * to fit incomingChunkBytes without exceeding maxVramBytes.
   */
  planEviction(incomingChunkBytes: number): number[] {
    const projectedUsage = this.currentAllocatedBytes + incomingChunkBytes;
    if (projectedUsage <= this.maxVramBytes) {
      return [];
    }

    const deficit = projectedUsage - this.maxVramBytes;
    let reclaimed = 0;
    const toEvict: number[] = [];

    for (const chunkId of this.lruAccessList) {
      const chunk = this.chunks.get(chunkId);
      if (chunk && chunk.isResident) {
        toEvict.push(chunkId);
        reclaimed += chunk.byteLength;
        if (reclaimed >= deficit) {
          break;
        }
      }
    }

    return toEvict;
  }

  markResident(chunkId: number): void {
    const chunk = this.chunks.get(chunkId);
    if (chunk && !chunk.isResident) {
      chunk.isResident = true;
      this.currentAllocatedBytes += chunk.byteLength;
      this.touchChunk(chunkId);
    }
  }

  markEvicted(chunkId: number): void {
    const chunk = this.chunks.get(chunkId);
    if (chunk && chunk.isResident) {
      chunk.isResident = false;
      this.currentAllocatedBytes = Math.max(0, this.currentAllocatedBytes - chunk.byteLength);
      const idx = this.lruAccessList.indexOf(chunkId);
      if (idx !== -1) {
        this.lruAccessList.splice(idx, 1);
      }
    }
  }

  getAllocatedBytes(): number {
    return this.currentAllocatedBytes;
  }

  getMaxVramBytes(): number {
    return this.maxVramBytes;
  }
}
