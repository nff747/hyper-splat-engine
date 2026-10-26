/**
 * Fast CPU-side & GPU simulation Radix Sort for sorting millions of Gaussian Splats
 * by view-space depth (Z) prior to alpha-blended composition.
 */

export function sortSplatsByDepth(
  depths: Float32Array,
  indices: Uint32Array,
  ascending: boolean = true,
  scratchKeys?: Uint32Array,
  scratchIndices?: Uint32Array
): void {
  const count = depths.length;
  if (count <= 1) return;

  // Re-initialize index sequence if unpopulated
  if (indices.length < count) {
    throw new RangeError(`Indices array length (${indices.length}) is smaller than depths (${count})`);
  }

  // 16-bit 2-pass Radix Sort on positive IEEE 754 representations
  // Map float to sortable uint32: invert negative numbers or flip sign bit
  const u32Keys = scratchKeys && scratchKeys.length >= count ? scratchKeys.subarray(0, count) : new Uint32Array(count);
  const floatView = new Float32Array(u32Keys.buffer, u32Keys.byteOffset, count);

  for (let i = 0; i < count; i++) {
    const rawVal = depths[i];
    // Security & Numeric Guard: Neutralize NaNs, Infs, and Subnormals to 0 or MAX_FLOAT
    const safeVal = Number.isFinite(rawVal) ? Math.max(0.0, rawVal) : (Number.isNaN(rawVal) ? 0.0 : 1e9);
    floatView[i] = safeVal;
    const u = u32Keys[i];
    // If sign bit set, invert all bits; otherwise flip sign bit
    u32Keys[i] = (u & 0x80000000) ? ~u : (u ^ 0x80000000);
  }

  const tempIndices = scratchIndices && scratchIndices.length >= count ? scratchIndices.subarray(0, count) : new Uint32Array(count);
  const tempKeys = new Uint32Array(count);

  // Pass 0: bits 0..15 (radix 65536)
  const histogram0 = new Uint32Array(65536);
  for (let i = 0; i < count; i++) {
    histogram0[u32Keys[i] & 0xffff]++;
  }

  const offset0 = new Uint32Array(65536);
  let sum0 = 0;
  for (let i = 0; i < 65536; i++) {
    offset0[i] = sum0;
    sum0 += histogram0[i];
  }

  for (let i = 0; i < count; i++) {
    const bucket = u32Keys[i] & 0xffff;
    const dest = offset0[bucket]++;
    tempIndices[dest] = indices[i];
    tempKeys[dest] = u32Keys[i];
  }

  // Pass 1: bits 16..31 (radix 65536)
  const histogram1 = new Uint32Array(65536);
  for (let i = 0; i < count; i++) {
    histogram1[(tempKeys[i] >>> 16) & 0xffff]++;
  }

  const offset1 = new Uint32Array(65536);
  let sum1 = 0;
  for (let i = 0; i < 65536; i++) {
    offset1[i] = sum1;
    sum1 += histogram1[i];
  }

  for (let i = 0; i < count; i++) {
    const bucket = (tempKeys[i] >>> 16) & 0xffff;
    const dest = offset1[bucket]++;
    if (ascending) {
      indices[dest] = tempIndices[i];
    } else {
      // Invert destination for descending order (back-to-front rendering)
      indices[count - 1 - dest] = tempIndices[i];
    }
  }
}
