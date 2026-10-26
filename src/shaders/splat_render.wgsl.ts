export const SPLAT_RENDER_WGSL = /* wgsl */ `
struct CameraUniforms {
  viewMatrix: mat4x4<f32>,
  projMatrix: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  viewport: vec2<f32>,
  focal: vec2<f32>,
};

@group(0) @binding(0) var<uniform> camera: CameraUniforms;

struct SplatData {
  pos: vec3<f32>,
  cov2d_xx: f32,
  cov2d_xy: f32,
  cov2d_yy: f32,
  color: vec4<f32>,
};

@group(0) @binding(1) var<storage, read> splats: array<SplatData>;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) uv: vec2<f32>,
};

@vertex
fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  var output: VertexOutput;
  let splat = splats[instanceIndex];

  // Quad vertices from vertex index [0..5] (two triangles)
  var quadOffsets = array<vec2<f32>, 6>(
    vec2<f32>(-2.0, -2.0),
    vec2<f32>( 2.0, -2.0),
    vec2<f32>(-2.0,  2.0),
    vec2<f32>(-2.0,  2.0),
    vec2<f32>( 2.0, -2.0),
    vec2<f32>( 2.0,  2.0)
  );

  let offset = quadOffsets[vertexIndex];

  // Compute 2D eigenvalues / radii for billboard quad
  let a = splat.cov2d_xx;
  let b = splat.cov2d_xy;
  let c = splat.cov2d_yy;
  let trace = a + c;
  let det = max(0.0001, a * c - b * b);
  let term = sqrt(max(0.1, (a - c) * (a - c) + 4.0 * b * b));
  let lambda1 = (trace + term) * 0.5;
  let lambda2 = (trace - term) * 0.5;
  let radius = 3.0 * sqrt(max(lambda1, lambda2));

  let viewPos = camera.viewMatrix * vec4<f32>(splat.pos, 1.0);
  let clipPos = camera.projMatrix * viewPos;

  // Defensive Near-Plane & Degenerate Viewport Clipping Guard:
  // If behind or touching camera near plane (clipPos.w <= 0.001) or viewport is zero,
  // collapse vertex into degenerate clip coordinates to avoid divide-by-zero GPU hangs.
  if (clipPos.w <= 0.001 || camera.viewport.x <= 1e-4 || camera.viewport.y <= 1e-4) {
    output.position = vec4<f32>(0.0, 0.0, 2.0, 1.0); // Outside NDC depth [0, 1]
    output.color = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    output.uv = vec2<f32>(999.0, 999.0);
    return output;
  }

  let screenPos = clipPos.xy / clipPos.w;
  let pixelOffset = offset * (radius / camera.viewport);

  output.position = vec4<f32>((screenPos + pixelOffset) * clipPos.w, clipPos.z, clipPos.w);
  output.color = splat.color;
  output.uv = offset;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  // Gaussian radial decay: exp(-0.5 * (u^2 + v^2))
  let d2 = dot(input.uv, input.uv);
  if (d2 > 4.0) {
    discard;
  }
  let alpha = exp(-0.5 * d2) * input.color.a;
  return vec4<f32>(input.color.rgb * alpha, alpha);
}
`;
