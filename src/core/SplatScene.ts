import { SplatVertex, EngineConfig, CameraUniforms } from './types';
import { VRAMVirtualizer } from '../streaming/VRAMVirtualizer';
import { sortSplatsByDepth } from '../math/sorting';
import { compute3DCovariance, project2DCovariance } from '../math/covariance';

export class SplatScene {
  private splats: SplatVertex[] = [];
  private virtualizer: VRAMVirtualizer;
  private config: Required<EngineConfig>;

  constructor(config?: EngineConfig) {
    this.config = {
      maxVramBytes: config?.maxVramBytes ?? 512 * 1024 * 1024,
      nearLodDist: config?.nearLodDist ?? 10.0,
      farLodDist: config?.farLodDist ?? 50.0,
      workgroupSize: config?.workgroupSize ?? 64,
      debug: config?.debug ?? false,
    };
    this.virtualizer = new VRAMVirtualizer(this.config.maxVramBytes);
  }

  addSplats(vertices: SplatVertex[]): void {
    this.splats.push(...vertices);
  }

  getSplatCount(): number {
    return this.splats.length;
  }

  /**
   * Prepares and depth-sorts all splats relative to the active camera.
   * Returns sorted indices and projected 2D covariance data ready for GPU uniform packing.
   */
  prepareFrame(camera: CameraUniforms): { sortedIndices: Uint32Array; splatCount: number } {
    const count = this.splats.length;
    if (count === 0) {
      return { sortedIndices: new Uint32Array(0), splatCount: 0 };
    }

    const depths = new Float32Array(count);
    const indices = new Uint32Array(count);
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

    // Sort descending (back-to-front alpha blending)
    sortSplatsByDepth(depths, indices, false);

    return {
      sortedIndices: indices,
      splatCount: count,
    };
  }

  getVirtualizer(): VRAMVirtualizer {
    return this.virtualizer;
  }
}
