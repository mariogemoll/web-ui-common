/**
 * Quantizes a Float32Array to 8-bit unsigned integers with range encoding:
 * - 8 byte header: min (float32) and max (float32) values
 * - Rest: quantized values as uint8 (0-255 uniformly mapped to min-max range)
 *
 * This achieves ~75% size reduction (4 bytes -> 1 byte per value)
 */
export function quantizeFloats(data: Float32Array): ArrayBuffer {
  if (data.length === 0) {
    throw new Error('Cannot compress empty array');
  }

  // Find min and max
  let minVal = Infinity;
  let maxVal = -Infinity;
  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }

  // Create output buffer: 8 bytes header + 1 byte per value
  const buffer = new ArrayBuffer(8 + data.length);
  const headerView = new DataView(buffer, 0, 8);
  const quantizedView = new Uint8Array(buffer, 8);

  // Write header (min, max as little-endian float32)
  headerView.setFloat32(0, minVal, true);
  headerView.setFloat32(4, maxVal, true);

  // Quantize and write data
  const extent = maxVal - minVal;
  if (extent === 0) {
    // All values are the same - store as zeros
    quantizedView.fill(0);
  } else {
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - minVal) / extent; // 0 to 1
      const quantized = Math.round(normalized * 255); // 0 to 255
      quantizedView[i] = quantized;
    }
  }

  return buffer;
}

/**
 * Dequantizes an 8-bit quantized buffer back to Float32Array.
 * Reads two 32-bit little-endian floats from the start of the buffer as min and max values.
 * Then reads the rest as an array of uint8 values and linearly scales them to the range [min, max].
 */
export function dequantizeFloats(buf: ArrayBuffer): [number, number, Float32Array] {
  const headerView = new DataView(buf, 0, 8);
  const minVal = headerView.getFloat32(0, true); // little-endian
  const maxVal = headerView.getFloat32(4, true);
  const gridUint8 = new Uint8Array(buf, 8);  // Skip first 8 bytes
  const extent = maxVal - minVal;

  function convert(val: number): number {
    if (extent === 0) {
      return minVal; // All values are the same
    }
    return minVal + (val / 255.0) * extent;
  }

  const gridData = new Float32Array(gridUint8.length);
  for (let i = 0; i < gridUint8.length; i++) {
    gridData[i] = convert(gridUint8[i]);
  }

  return [minVal, maxVal, gridData];
}
