# hyper-splat-engine

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/nff747/hyper-splat-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/nff747/hyper-splat-engine/actions)

Zero-copy, virtualized WebGPU 3D Gaussian Splatting and spatial AI engine with distance LoD tile streaming and proactive VRAM paging.

## Features

- **Virtualized VRAM Manager (`VRAMVirtualizer`)**: Proactively monitors GPU memory allocation pressure and automatically pages cold/distant splats out to RAM/storage before encountering WebGPU device loss.
- **EWA 3D-to-2D Covariance Projection**: High-precision Elliptical Weighted Average screen-space projection with low-pass anti-aliasing clamping.
- **Pure WGSL Billboard Pipeline**: Compute-driven billboard quad vertex expansion and radial Gaussian falloff fragment evaluation.
- **Zero-Copy Streaming**: Designed for streaming multi-million Gaussian Splat captures without blocking the browser main thread.

## Installation

```bash
npm install hyper-splat-engine
```

## Quick Start

```typescript
import { compute3DCovariance, project2DCovariance, VRAMVirtualizer } from 'hyper-splat-engine';

// Manage 512 MB WebGPU allocation budget
const virtualizer = new VRAMVirtualizer(512 * 1024 * 1024);

// Evaluate 3D Gaussian covariance
const cov3D = compute3DCovariance([1.0, 1.0, 1.0], [0, 0, 0, 1]);
const cov2D = project2DCovariance(cov3D, [0, 0, 5], 800, 800);
```

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for details.
