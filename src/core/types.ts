export interface SplatVertex {
  position: [number, number, number];
  scale: [number, number, number];
  rotation: [number, number, number, number]; // quaternion (x, y, z, w)
  color: [number, number, number, number];   // RGBA (0-1)
}

export interface EngineConfig {
  maxVramBytes?: number;
  nearLodDist?: number;
  farLodDist?: number;
  workgroupSize?: number;
  debug?: boolean;
}

export interface SplatChunkDescriptor {
  chunkId: number;
  splatCount: number;
  byteOffset: number;
  byteLength: number;
  lodLevel: number;
  isResident: boolean;
}

export interface CameraUniforms {
  viewMatrix: Float32Array;
  projMatrix: Float32Array;
  cameraPosition: [number, number, number];
  viewportSize: [number, number];
  focalLength: [number, number];
}
