import { describe, it, expect } from 'vitest';
import { SplatScene } from '../src/core/SplatScene';
import { SplatVertex, CameraUniforms } from '../src/core/types';

describe('SplatScene Pipeline', () => {
  it('prepares and sorts splats back-to-front relative to camera position', () => {
    const scene = new SplatScene();

    const s1: SplatVertex = {
      position: [0, 0, 5], // 5 units away
      scale: [1, 1, 1],
      rotation: [0, 0, 0, 1],
      color: [1, 0, 0, 1],
    };

    const s2: SplatVertex = {
      position: [0, 0, 20], // 20 units away
      scale: [1, 1, 1],
      rotation: [0, 0, 0, 1],
      color: [0, 1, 0, 1],
    };

    scene.addSplats([s1, s2]);
    expect(scene.getSplatCount()).toBe(2);

    const camera: CameraUniforms = {
      viewMatrix: new Float32Array(16),
      projMatrix: new Float32Array(16),
      cameraPosition: [0, 0, 0],
      viewportSize: [1920, 1080],
      focalLength: [1100, 1100],
    };

    const frame = scene.prepareFrame(camera);
    expect(frame.splatCount).toBe(2);
    // Back-to-front: index 1 (s2, 20 units) must precede index 0 (s1, 5 units)
    expect(frame.sortedIndices[0]).toBe(1);
    expect(frame.sortedIndices[1]).toBe(0);
  });
});
