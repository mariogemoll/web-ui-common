import type { Pair, Scale } from './types';
import { generateTicks } from './util';

export interface WebGlLineRenderer {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  positionLocation: number;
  colorLocation: WebGLUniformLocation;
}

export interface WebGlPointRenderer {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  positionBuffer: WebGLBuffer;
  positionLocation: number;
  colorLocation: WebGLUniformLocation;
  sizeLocation: WebGLUniformLocation;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error('Failed to create shader');
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) === false) {
    const error = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
    gl.deleteShader(shader);
    throw new Error(error);
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSrc: string,
  fragmentSrc: string
): WebGLProgram {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS) === false) {
    const error = gl.getProgramInfoLog(program) ?? 'Unknown program link error';
    gl.deleteProgram(program);
    throw new Error(error);
  }
  return program;
}

export function getWebGlContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
  const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as
    | WebGLRenderingContext
    | null;
  if (!gl) {
    throw new Error('Failed to get WebGl context');
  }
  return gl;
}

export function createLineRenderer(gl: WebGLRenderingContext): WebGlLineRenderer {
  const vertexSrc = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSrc = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      gl_FragColor = u_color;
    }
  `;

  const program = createProgram(gl, vertexSrc, fragmentSrc);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const colorLocation = gl.getUniformLocation(program, 'u_color');
  if (colorLocation === null) {
    throw new Error('Failed to find uniform u_color');
  }

  const positionBuffer = gl.createBuffer();

  return {
    gl,
    program,
    positionBuffer,
    positionLocation,
    colorLocation
  };
}

export function createPointRenderer(gl: WebGLRenderingContext): WebGlPointRenderer {
  const vertexSrc = `
    attribute vec2 a_position;
    uniform float u_pointSize;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      gl_PointSize = u_pointSize;
    }
  `;

  const fragmentSrc = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      if (length(coord) > 0.5) {
        discard;
      }
      gl_FragColor = u_color;
    }
  `;

  const program = createProgram(gl, vertexSrc, fragmentSrc);
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const colorLocation = gl.getUniformLocation(program, 'u_color');
  const sizeLocation = gl.getUniformLocation(program, 'u_pointSize');
  if (colorLocation === null || sizeLocation === null) {
    throw new Error('Failed to find point uniforms');
  }

  const positionBuffer = gl.createBuffer();

  return {
    gl,
    program,
    positionBuffer,
    positionLocation,
    colorLocation,
    sizeLocation
  };
}

export function clearWebGl(
  gl: WebGLRenderingContext,
  color: [number, number, number, number]
): void {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(color[0], color[1], color[2], color[3]);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function toClipSpace(canvas: HTMLCanvasElement, x: number, y: number): Pair<number> {
  const clipX = (x / canvas.width) * 2 - 1;
  const clipY = 1 - (y / canvas.height) * 2;
  return [clipX, clipY];
}

const colorCanvas = document.createElement('canvas');
colorCanvas.width = 1;
colorCanvas.height = 1;
const colorCtx = colorCanvas.getContext('2d');
const colorCache = new Map<string, [number, number, number, number]>();

function parseCssColor(color: string): [number, number, number, number] {
  const cached = colorCache.get(color);
  if (cached) {
    return cached;
  }
  if (!colorCtx) {
    return [0, 0, 0, 1];
  }
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = color;
  colorCtx.fillRect(0, 0, 1, 1);
  const data = colorCtx.getImageData(0, 0, 1, 1).data;
  const rgba: [number, number, number, number] = [
    (data[0] ?? 0) / 255,
    (data[1] ?? 0) / 255,
    (data[2] ?? 0) / 255,
    (data[3] ?? 255) / 255
  ];
  colorCache.set(color, rgba);
  return rgba;
}

export function drawLineSegments(
  renderer: WebGlLineRenderer,
  segments: [Pair<number>, Pair<number>][],
  color: string
): void {
  if (segments.length === 0) {
    return;
  }

  const gl = renderer.gl;
  const positions: number[] = [];

  for (const [start, end] of segments) {
    const [x1, y1] = toClipSpace(gl.canvas as HTMLCanvasElement, start[0], start[1]);
    const [x2, y2] = toClipSpace(gl.canvas as HTMLCanvasElement, end[0], end[1]);
    positions.push(x1, y1, x2, y2);
  }

  gl.useProgram(renderer.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);

  const rgba = parseCssColor(color);
  gl.uniform4fv(renderer.colorLocation, rgba);
  gl.drawArrays(gl.LINES, 0, positions.length / 2);
}

export function drawTriangles(
  renderer: WebGlLineRenderer,
  triangles: [Pair<number>, Pair<number>, Pair<number>][],
  color: string
): void {
  if (triangles.length === 0) {
    return;
  }

  const gl = renderer.gl;
  const positions: number[] = [];

  for (const [p1, p2, p3] of triangles) {
    const [x1, y1] = toClipSpace(gl.canvas as HTMLCanvasElement, p1[0], p1[1]);
    const [x2, y2] = toClipSpace(gl.canvas as HTMLCanvasElement, p2[0], p2[1]);
    const [x3, y3] = toClipSpace(gl.canvas as HTMLCanvasElement, p3[0], p3[1]);
    positions.push(x1, y1, x2, y2, x3, y3);
  }

  gl.useProgram(renderer.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);

  const rgba = parseCssColor(color);
  gl.uniform4fv(renderer.colorLocation, rgba);
  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
}

export function drawLineSegmentsFromBuffer(
  renderer: WebGlLineRenderer,
  buffer: WebGLBuffer,
  vertexCount: number,
  color: string
): void {
  if (vertexCount === 0) {
    return;
  }

  const gl = renderer.gl;
  gl.useProgram(renderer.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);

  const rgba = parseCssColor(color);
  gl.uniform4fv(renderer.colorLocation, rgba);
  gl.drawArrays(gl.LINES, 0, vertexCount);
}

export function drawPointsWebGl(
  renderer: WebGlPointRenderer,
  points: Pair<number>[],
  color: string,
  size = 10,
  colors?: string[]
): void {
  if (points.length === 0) {
    return;
  }

  const gl = renderer.gl;

  gl.useProgram(renderer.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform1f(renderer.sizeLocation, size);

  if (!colors) {
    const positions: number[] = [];
    for (const point of points) {
      const [x, y] = toClipSpace(gl.canvas as HTMLCanvasElement, point[0], point[1]);
      positions.push(x, y);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const rgba = parseCssColor(color);
    gl.uniform4fv(renderer.colorLocation, rgba);
    gl.drawArrays(gl.POINTS, 0, positions.length / 2);
    return;
  }

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const pointColor = colors[i];
    if (point === undefined) {
      continue;
    }
    if (pointColor === undefined) {
      throw new Error(`drawPointsWebGl: colors[${i}] is undefined`);
    }
    const [x, y] = toClipSpace(gl.canvas as HTMLCanvasElement, point[0], point[1]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x, y]), gl.STATIC_DRAW);
    const rgba = parseCssColor(pointColor);
    gl.uniform4fv(renderer.colorLocation, rgba);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

export function drawPolylineWebGlThick(
  renderer: WebGlLineRenderer,
  points: Pair<number>[],
  color: string,
  thickness = 2
): void {
  if (points.length < 2) {
    return;
  }

  const gl = renderer.gl;
  const positions: number[] = [];
  const half = thickness / 2;

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (!start || !end) {
      continue;
    }
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      continue;
    }
    const nx = (-dy / len) * half;
    const ny = (dx / len) * half;

    const a: Pair<number> = [start[0] + nx, start[1] + ny];
    const b: Pair<number> = [start[0] - nx, start[1] - ny];
    const c: Pair<number> = [end[0] + nx, end[1] + ny];
    const d: Pair<number> = [end[0] - nx, end[1] - ny];

    const [ax, ay] = toClipSpace(gl.canvas as HTMLCanvasElement, a[0], a[1]);
    const [bx, by] = toClipSpace(gl.canvas as HTMLCanvasElement, b[0], b[1]);
    const [cx, cy] = toClipSpace(gl.canvas as HTMLCanvasElement, c[0], c[1]);
    const [dxClip, dyClip] = toClipSpace(gl.canvas as HTMLCanvasElement, d[0], d[1]);

    positions.push(ax, ay, bx, by, cx, cy);
    positions.push(bx, by, dxClip, dyClip, cx, cy);
  }

  if (positions.length === 0) {
    return;
  }

  gl.useProgram(renderer.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);

  const rgba = parseCssColor(color);
  gl.uniform4fv(renderer.colorLocation, rgba);
  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
}

export function drawCirclesWebGl(
  renderer: WebGlLineRenderer,
  points: Pair<number>[],
  color: string,
  radius = 4,
  segments = 20,
  colors?: string[]
): void {
  if (points.length === 0) {
    return;
  }

  const gl = renderer.gl;

  const drawCircle = (point: Pair<number>, circleColor: string): void => {
    const positions: number[] = [];
    const center = toClipSpace(gl.canvas as HTMLCanvasElement, point[0], point[1]);
    for (let i = 0; i < segments; i++) {
      const angleA = (i / segments) * Math.PI * 2;
      const angleB = ((i + 1) / segments) * Math.PI * 2;
      const ax = point[0] + Math.cos(angleA) * radius;
      const ay = point[1] + Math.sin(angleA) * radius;
      const bx = point[0] + Math.cos(angleB) * radius;
      const by = point[1] + Math.sin(angleB) * radius;
      const aClip = toClipSpace(gl.canvas as HTMLCanvasElement, ax, ay);
      const bClip = toClipSpace(gl.canvas as HTMLCanvasElement, bx, by);
      positions.push(center[0], center[1], aClip[0], aClip[1], bClip[0], bClip[1]);
    }

    gl.useProgram(renderer.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(renderer.positionLocation);
    gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);

    const rgba = parseCssColor(circleColor);
    gl.uniform4fv(renderer.colorLocation, rgba);
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
  };

  if (!colors) {
    for (const point of points) {
      drawCircle(point, color);
    }
    return;
  }

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const pointColor = colors[i];
    if (point === undefined) {
      continue;
    }
    if (pointColor === undefined) {
      throw new Error(`drawCirclesWebGl: colors[${i}] is undefined`);
    }
    drawCircle(point, pointColor);
  }
}

export function drawPolylineWebGl(
  renderer: WebGlLineRenderer,
  points: Pair<number>[],
  color: string
): void {
  if (points.length < 2) {
    return;
  }

  const gl = renderer.gl;
  const positions: number[] = [];

  for (const point of points) {
    const [x, y] = toClipSpace(gl.canvas as HTMLCanvasElement, point[0], point[1]);
    positions.push(x, y);
  }

  gl.useProgram(renderer.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);

  const rgba = parseCssColor(color);
  gl.uniform4fv(renderer.colorLocation, rgba);
  gl.drawArrays(gl.LINE_STRIP, 0, positions.length / 2);
}

export function drawFilledLineWebGl(
  renderer: WebGlLineRenderer,
  points: Pair<number>[],
  baselineY: number,
  color: string
): void {
  if (points.length < 2) {
    return;
  }

  const gl = renderer.gl;
  const positions: number[] = [];

  for (const point of points) {
    const [x, y] = toClipSpace(gl.canvas as HTMLCanvasElement, point[0], point[1]);
    const [baseX, baseY] = toClipSpace(gl.canvas as HTMLCanvasElement, point[0], baselineY);
    positions.push(baseX, baseY, x, y);
  }

  gl.useProgram(renderer.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, renderer.positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(renderer.positionLocation);
  gl.vertexAttribPointer(renderer.positionLocation, 2, gl.FLOAT, false, 0, 0);

  const rgba = parseCssColor(color);
  gl.uniform4fv(renderer.colorLocation, rgba);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, positions.length / 2);
}

export function withScissorRegionFromScales<T>(
  gl: WebGLRenderingContext,
  xScale: Scale,
  yScale: Scale,
  drawFn: () => T
): T {
  const [xMin, xMax] = xScale.range;
  const yTop = yScale.range[1];
  const yBottom = yScale.range[0];
  const width = xMax - xMin;
  const height = yBottom - yTop;
  const scissorY = (gl.canvas as HTMLCanvasElement).height - yBottom;

  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(Math.round(xMin), Math.round(scissorY), Math.round(width), Math.round(height));
  const result = drawFn();
  gl.disable(gl.SCISSOR_TEST);
  return result;
}

export interface AxesThroughOriginOptions {
  showTicks?: boolean;
  showLabels?: boolean;
  numTicks?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface DrawFunction1DWebGlOptions {
  stroke?: string;
  sampleCount?: number;
  thickness?: number;
}

export function drawGridLinesWebGl(
  renderer: WebGlLineRenderer,
  xScale: Scale,
  yScale: Scale,
  numTicks: number,
  color = '#e0e0e0'
): void {
  const xTicks = generateTicks(xScale.domain, numTicks);
  const yTicks = generateTicks(yScale.domain, numTicks);

  const segments: [Pair<number>, Pair<number>][] = [];

  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    segments.push([[x, yScale.range[1]], [x, yScale.range[0]]]);
  });

  yTicks.forEach((tickValue: number) => {
    const y = yScale(tickValue);
    segments.push([[xScale.range[0], y], [xScale.range[1], y]]);
  });

  drawLineSegments(renderer, segments, color);
}

export function drawFrameUsingScalesWebGl(
  renderer: WebGlLineRenderer,
  xScale: Scale,
  yScale: Scale,
  numTicks: number
): void {
  const segments: [Pair<number>, Pair<number>][] = [];

  segments.push([[xScale.range[0], yScale.range[0]], [xScale.range[1], yScale.range[0]]]);
  segments.push([[xScale.range[0], yScale.range[0]], [xScale.range[0], yScale.range[1]]]);
  segments.push([[xScale.range[0], yScale.range[1]], [xScale.range[1], yScale.range[1]]]);
  segments.push([[xScale.range[1], yScale.range[0]], [xScale.range[1], yScale.range[1]]]);

  const xTicks = generateTicks(xScale.domain, numTicks);
  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    segments.push([[x, yScale.range[0]], [x, yScale.range[0] + 6]]);
  });

  const yTicks = generateTicks(yScale.domain, numTicks);
  yTicks.forEach((tickValue: number) => {
    const y = yScale(tickValue);
    segments.push([[xScale.range[0] - 6, y], [xScale.range[0], y]]);
  });

  drawLineSegments(renderer, segments, 'black');
}

export function drawAxesThroughOriginWebGl(
  renderer: WebGlLineRenderer,
  xScale: Scale,
  yScale: Scale,
  options: AxesThroughOriginOptions = {}
): void {
  const {
    showTicks = false,
    numTicks = 6,
    color = 'black'
  } = options;

  const originX = xScale(0);
  const originY = yScale(0);

  const segments: [Pair<number>, Pair<number>][] = [];
  segments.push([[xScale.range[0], originY], [xScale.range[1], originY]]);
  segments.push([[originX, yScale.range[0]], [originX, yScale.range[1]]]);

  if (showTicks) {
    const xTicks = generateTicks(xScale.domain, numTicks);
    xTicks.forEach((tickValue: number) => {
      if (tickValue === 0) {
        return;
      }
      const x = xScale(tickValue);
      segments.push([[x, originY - 3], [x, originY + 3]]);
    });

    const yTicks = generateTicks(yScale.domain, numTicks);
    yTicks.forEach((tickValue: number) => {
      if (tickValue === 0) {
        return;
      }
      const y = yScale(tickValue);
      segments.push([[originX - 3, y], [originX + 3, y]]);
    });
  }

  drawLineSegments(renderer, segments, color);
}

export function drawFunction1DWebGl(
  renderer: WebGlLineRenderer,
  xScale: Scale,
  yScale: Scale,
  fn: (x: number) => number,
  options: DrawFunction1DWebGlOptions = {}
): void {
  const {
    stroke = 'steelblue',
    sampleCount = Math.max(2, Math.floor(Math.abs(xScale.range[1] - xScale.range[0]))),
    thickness = 2
  } = options;

  if (sampleCount < 2) {
    return;
  }

  const [domainStart, domainEnd] = xScale.domain;
  const totalRange = domainEnd - domainStart;

  const points: Pair<number>[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const xValue = domainStart + t * totalRange;
    const yValue = fn(xValue);
    if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
      continue;
    }
    const canvasX = xScale(xValue);
    const canvasY = yScale(yValue);
    if (!Number.isFinite(canvasX) || !Number.isFinite(canvasY)) {
      continue;
    }
    points.push([canvasX, canvasY]);
  }

  drawPolylineWebGlThick(renderer, points, stroke, thickness);
}
