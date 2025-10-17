import { describe, it, expect } from 'vitest';
import { quantizeFloats, dequantizeFloats } from '../src/data';

describe('quantizeFloats', () => {
  it('should quantize and dequantize a simple array', () => {
    const data = new Float32Array([1.0, 2.0, 3.0, 4.0, 5.0]);
    const quantized = quantizeFloats(data);
    const [min, max, dequantized] = dequantizeFloats(quantized);

    expect(min).toBe(1.0);
    expect(max).toBe(5.0);
    expect(dequantized.length).toBe(5);

    // Values should be approximately equal (within quantization error)
    for (let i = 0; i < data.length; i++) {
      expect(dequantized[i]!).toBeCloseTo(data[i]!, 1);
    }
  });

  it('should handle negative values', () => {
    const data = new Float32Array([-10.0, -5.0, 0.0, 5.0, 10.0]);
    const quantized = quantizeFloats(data);
    const [min, max, dequantized] = dequantizeFloats(quantized);

    expect(min).toBe(-10.0);
    expect(max).toBe(10.0);

    for (let i = 0; i < data.length; i++) {
      expect(dequantized[i]!).toBeCloseTo(data[i]!, 1);
    }
  });

  it('should handle all identical values', () => {
    const data = new Float32Array([42.5, 42.5, 42.5, 42.5]);
    const quantized = quantizeFloats(data);
    const [min, max, dequantized] = dequantizeFloats(quantized);

    expect(min).toBe(42.5);
    expect(max).toBe(42.5);

    for (let i = 0; i < data.length; i++) {
      expect(dequantized[i]).toBe(42.5);
    }
  });

  it('should handle very small ranges', () => {
    const data = new Float32Array([1.0001, 1.0002, 1.0003]);
    const quantized = quantizeFloats(data);
    const [min, max, dequantized] = dequantizeFloats(quantized);

    expect(min).toBeCloseTo(1.0001, 4);
    expect(max).toBeCloseTo(1.0003, 4);

    // With such a small range, quantization error might be larger
    for (let i = 0; i < data.length; i++) {
      expect(dequantized[i]!).toBeCloseTo(data[i]!, 3);
    }
  });

  it('should handle large values', () => {
    const data = new Float32Array([1e6, 2e6, 3e6]);
    const quantized = quantizeFloats(data);
    const [min, max, dequantized] = dequantizeFloats(quantized);

    expect(min).toBeCloseTo(1e6, -2);
    expect(max).toBeCloseTo(3e6, -2);

    // Large values with 8-bit quantization lose precision
    // For a range of 2e6 over 255 steps, each step is ~7843
    for (let i = 0; i < data.length; i++) {
      expect(dequantized[i]!).toBeCloseTo(data[i]!, -4); // Tolerance of ~10000 for large numbers
    }
  });

  it('should throw error on empty array', () => {
    const data = new Float32Array([]);
    expect(() => quantizeFloats(data)).toThrow('Cannot compress empty array');
  });

  it('should achieve compression (use less space)', () => {
    const data = new Float32Array(1000);
    for (let i = 0; i < 1000; i++) {
      data[i] = Math.random() * 100;
    }

    const quantized = quantizeFloats(data);
    const originalSize = data.byteLength; // 4000 bytes (4 bytes per float)
    const quantizedSize = quantized.byteLength; // 1008 bytes (8 byte header + 1000 bytes)

    expect(quantizedSize).toBe(8 + 1000); // Header + 1 byte per value
    expect(quantizedSize).toBeLessThan(originalSize);
  });

  it('should handle single value', () => {
    const data = new Float32Array([3.14]);
    const quantized = quantizeFloats(data);
    const [min, max, dequantized] = dequantizeFloats(quantized);

    // Float32 has limited precision, so 3.14 may not be stored exactly
    expect(min).toBeCloseTo(3.14, 5);
    expect(max).toBeCloseTo(3.14, 5);
    expect(dequantized.length).toBe(1);
    expect(dequantized[0]).toBeCloseTo(3.14, 5);
  });

  it('should preserve extreme values in range', () => {
    const data = new Float32Array([0, 0.25, 0.5, 0.75, 1.0]);
    const quantized = quantizeFloats(data);
    const [, , dequantized] = dequantizeFloats(quantized);

    // Min and max should be exact
    expect(dequantized[0]).toBe(0);
    expect(dequantized[4]).toBe(1.0);

    // Middle values should be close
    expect(dequantized[1]).toBeCloseTo(0.25, 2);
    expect(dequantized[2]).toBeCloseTo(0.5, 2);
    expect(dequantized[3]).toBeCloseTo(0.75, 2);
  });
});

describe('dequantizeFloats', () => {
  it('should correctly read header and data', () => {
    const data = new Float32Array([10, 20, 30]);
    const quantized = quantizeFloats(data);
    const [min, max, dequantized] = dequantizeFloats(quantized);

    expect(min).toBe(10);
    expect(max).toBe(30);
    expect(dequantized).toBeInstanceOf(Float32Array);
    expect(dequantized.length).toBe(3);
  });

  it('should handle manually created buffer', () => {
    // Create a buffer manually to test dequantizeFloats independently
    const buffer = new ArrayBuffer(8 + 3);
    const view = new DataView(buffer);

    // Write min (0.0) and max (10.0)
    view.setFloat32(0, 0.0, true);
    view.setFloat32(4, 10.0, true);

    // Write quantized values: 0, 127, 255 (should map to ~0, ~5, ~10)
    const uint8View = new Uint8Array(buffer, 8);
    uint8View[0] = 0;
    uint8View[1] = 127;
    uint8View[2] = 255;

    const [min, max, dequantized] = dequantizeFloats(buffer);

    expect(min).toBe(0.0);
    expect(max).toBe(10.0);
    expect(dequantized[0]).toBeCloseTo(0.0, 1);
    expect(dequantized[1]).toBeCloseTo(5.0, 1);
    expect(dequantized[2]).toBeCloseTo(10.0, 1);
  });
});

describe('quantization round-trip', () => {
  it('should maintain data integrity through multiple quantize/dequantize cycles', () => {
    const original = new Float32Array([1, 2, 3, 4, 5]);

    // First cycle
    const quantized1 = quantizeFloats(original);
    const [, , dequantized1] = dequantizeFloats(quantized1);

    // Second cycle (quantize the dequantized data)
    const quantized2 = quantizeFloats(dequantized1);
    const [, , dequantized2] = dequantizeFloats(quantized2);

    // Both dequantized versions should be similar to original
    for (let i = 0; i < original.length; i++) {
      expect(dequantized1[i]!).toBeCloseTo(original[i]!, 1);
      expect(dequantized2[i]!).toBeCloseTo(original[i]!, 1);
    }
  });
});
