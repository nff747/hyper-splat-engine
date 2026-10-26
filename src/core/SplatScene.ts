import { SplatVertex, EngineConfig, CameraUniforms } from './types';
import { VRAMVirtualizer } from '../streaming/VRAMVirtualizer';
import { sortSplatsByDepth } from '../math/sorting';
import { compute3DCovariance, project2DCovariance } from '../math/covariance';
import { ScratchMemoryPool } from './ScratchMemoryPool';

export class SplatScene {
  private splats: SplatVertex[] = [];
  private virtualizer: VRAMVirtualizer;
  private config: Required<EngineConfig>;
  private scratchPool: ScratchMemoryPool;

  constructor(config?: EngineConfig) {
    this.config = {
      maxVramBytes: config?.maxVramBytes ?? 512 * 1024 * 1024,
      nearLodDist: config?.nearLodDist ?? 10.0,
      farLodDist: config?.farLodDist ?? 50.0,
      workgroupSize: config?.workgroupSize ?? 64,
      debug: config?.debug ?? false,
    };
    this.virtualizer = new VRAMVirtualizer(this.config.maxVramBytes);
    this.scratchPool = new ScratchMemoryPool(65536);
  }

  addSplats(vertices: SplatVertex[]): void {
    this.splats.push(...vertices);
  }

  getSplatCount(): number {
    return this.splats.length;
  }

  /**
   * Prepares and depth-sorts all splats relative to the active camera.
   * Leverages pre-allocated ScratchMemoryPool to achieve zero GC pressure at 60+ FPS.
   */
  prepareFrame(camera: CameraUniforms): { sortedIndices: Uint32Array; splatCount: number } {
    const count = this.splats.length;
    if (count === 0) {
      return { sortedIndices: new Uint32Array(0), splatCount: 0 };
    }

    this.scratchPool.ensureCapacity(count);
    const depths = this.scratchPool.depths.subarray(0, count);
    const indices = this.scratchPool.indices.subarray(0, count);
    const [cx, cy, cz] = camera.cameraPosition;

    for (let i = 0; i < count; i++) {
      indices[i] = i;
      const pos = this.splats[i].position;
      const dx = pos[0] - cx;
      const dy = pos[1] - cy;
      const dz = pos[2] - cz;
      // Distance along view axis (depth)
      depths[i] = Math.hypot(dx, dy, dz);
    }

    // Sort descending (back-to-front alpha blending) with reusable scratch buffers
    sortSplatsByDepth(
      depths,
      indices,
      false,
      this.scratchPool.tempKeys,
      this.scratchPool.tempIndices
    );

    return {
      sortedIndices: indices,
      splatCount: count,
    };
  }

  getVirtualizer(): VRAMVirtualizer {
    return this.virtualizer;
  }

  getScratchPool(): ScratchMemoryPool {
    return this.scratchPool;
  }
}
