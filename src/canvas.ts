import type { Margins, Pair, Scale } from './types';
import { mapRange } from './util';

export interface DrawFunction1DOptions {
  stroke?: string;
  lineWidth?: number;
  sampleCount?: number;
}

export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for canvas');
  }
  return ctx;
}

export function addLine(
  ctx: CanvasRenderingContext2D, stroke: string, [x1, y1]: Pair<number>, [x2, y2]: Pair<number>
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x1 + 0.5, y1 + 0.5); // Adjust for crisp edges
  ctx.lineTo(x2 + 0.5, y2 + 0.5);
  ctx.stroke();
}

export function addHorizontalLine(
  ctx: CanvasRenderingContext2D, stroke: string, [x1, x2]: Pair<number>, y: number
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const adjustedY = y + 0.5; // Adjust for crisp edges
  ctx.moveTo(x1, adjustedY);
  ctx.lineTo(x2, adjustedY);
  ctx.stroke();
}

export function addVerticalLine(
  ctx: CanvasRenderingContext2D, stroke: string, x: number, [y1, y2]: Pair<number>
): void {
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const adjustedX = x + 0.5; // Adjust for crisp edges
  ctx.moveTo(adjustedX, y1);
  ctx.lineTo(adjustedX, y2);
  ctx.stroke();
}

export function addDot(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, fill = 'red'
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.fill();
}

export function addRect(
  ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number,
  fill?: string, stroke?: string
): void {
  if (fill !== undefined) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, width, height);
  }
  if (stroke !== undefined) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x + 0.5, y + 0.5, width, height);
  }
}

export function addText(
  ctx: CanvasRenderingContext2D,
  anchor: 'start' | 'middle' | 'end',
  x: number,
  y: number,
  textContent: string,
  fontSize = 10,
  fontFamily = 'sans-serif',
  fill = 'black'
): void {
  ctx.fillStyle = fill;
  ctx.font = `${fontSize.toString()}px ${fontFamily}`;
  ctx.textAlign = anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(textContent, x, y);
}

function generateTicks(range: [number, number], count = 6): number[] {
  const [min, max] = range;
  const step = (max - min) / (count - 1);
  const tickValues: number[] = [];

  for (let i = 0; i < count; i++) {
    tickValues.push(min + i * step);
  }

  return tickValues;
}

export function addAxes(
  ctx: CanvasRenderingContext2D,
  xScale: Scale,
  yScale: Scale,
  numTicks: number
): void {
  // x axis
  addHorizontalLine(ctx, 'black', xScale.range, yScale.range[0]);
  const xTicks = generateTicks(xScale.domain, numTicks);
  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    addVerticalLine(ctx, 'black', x, [yScale.range[0], yScale.range[0] + 6]);
    addText(ctx, 'middle', x, yScale.range[0] + 18, tickValue.toFixed(1));
  });

  // y axis
  addVerticalLine(ctx, 'black', xScale.range[0], [yScale.range[0], yScale.range[1]]);
  const yTicks = generateTicks(yScale.domain, numTicks);
  yTicks.forEach((tickValue: number) => {
    const y = yScale(tickValue);
    addHorizontalLine(ctx, 'black', [xScale.range[0] - 6, xScale.range[0]], y);
    addText(ctx, 'end', xScale.range[0] - 9, y + 3, tickValue.toFixed(1));
  });
}

export function addFrame(
  canvas: HTMLCanvasElement,
  margins: Margins,
  xRange: Pair<number>,
  yRange: Pair<number>,
  numTicks: number
): void {
  const ctx = getContext(canvas);

  const width = canvas.width;
  const height = canvas.height;

  const xScale = mapRange.bind(null, xRange, [margins.left, width - margins.right]);
  const yScale = mapRange.bind(null, yRange, [height - margins.bottom, margins.top]);

  // x axis
  addHorizontalLine(ctx, 'black', [margins.left, width - margins.right], height - margins.bottom);
  const xTicks = generateTicks(xRange, numTicks);
  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    addVerticalLine(ctx, 'black', x, [height - margins.bottom, height - margins.bottom + 6]);
    addText(ctx, 'middle', x, height - margins.bottom + 18, tickValue.toFixed(1));
  });

  // y axis
  addVerticalLine(ctx, 'black', margins.left, [margins.top, height - margins.bottom]);
  const yTicks = generateTicks(yRange, numTicks);
  yTicks.forEach((tickValue: number) => {
    const y = yScale(tickValue);
    addHorizontalLine(ctx, 'black', [margins.left - 6, margins.left], y);
    addText(ctx, 'end', margins.left - 9, y + 3, tickValue.toFixed(1));
  });

  // Add top border line
  addHorizontalLine(ctx, 'black', [margins.left, width - margins.right], margins.top);

  // Add right border line
  addVerticalLine(ctx, 'black', width - margins.right, [margins.top, height - margins.bottom]);
}

export function addFrameUsingScales(
  ctx: CanvasRenderingContext2D,
  xScale: Scale,
  yScale: Scale,
  numTicks: number
): void {

  // x axis
  addHorizontalLine(ctx, 'black', [xScale.range[0], xScale.range[1]], yScale.range[0]);
  const xTicks = generateTicks(xScale.domain, numTicks);
  xTicks.forEach((tickValue: number) => {
    const x = xScale(tickValue);
    addVerticalLine(ctx, 'black', x, [yScale.range[0], yScale.range[0] + 6]);
    addText(ctx, 'middle', x, yScale.range[0] + 18, tickValue.toFixed(1));
  });

  // y axis
  addVerticalLine(ctx, 'black', xScale.range[0], [yScale.range[0], yScale.range[1]]);
  const yTicks = generateTicks(yScale.domain, numTicks);
  yTicks.forEach((tickValue: number) => {
    const y = yScale(tickValue);
    addHorizontalLine(ctx, 'black', [xScale.range[0] - 6, xScale.range[0]], y);
    addHorizontalLine(ctx, 'black', [xScale.range[0] - 6, xScale.range[0]], y);
    addText(ctx, 'end', xScale.range[0] - 9, y + 3, tickValue.toFixed(1));
  });

  // Add top border line
  addHorizontalLine(ctx, 'black', [xScale.range[0], xScale.range[1]], yScale.range[1]);

  // Add right border line
  addVerticalLine(ctx, 'black', xScale.range[1], [yScale.range[0], yScale.range[1]]);
}

export function drawScatter(
  scatterCtx: CanvasRenderingContext2D,
  xScale: Scale,
  yScale: Scale,
  coords: Pair<number>[],
  colors: string[],
  highlightIndex?: number
): void {

  for (let i = 0; i < coords.length; i++) {
    const pair = coords[i];
    const color = colors[i];
    if (pair === undefined) {
      throw new Error(`drawScatter: coords[${i}] is undefined`);
    }
    if (color === undefined) {
      throw new Error(`drawScatter: colors[${i}] is undefined`);
    }
    const [x, y] = pair;
    scatterCtx.beginPath();
    scatterCtx.arc(xScale(x), yScale(y), 3, 0, 2 * Math.PI);
    scatterCtx.fillStyle = color;
    scatterCtx.fill();
  }

  if (highlightIndex !== undefined) {
    const pair = coords[highlightIndex];
    if (!pair) {
      throw new Error(`drawScatter: coords[highlightIndex=${highlightIndex}] is undefined`);
    }
    const [x, y] = pair;
    scatterCtx.beginPath();
    scatterCtx.arc(xScale(x), yScale(y), 6, 0, 3 * Math.PI);
    scatterCtx.strokeStyle = 'red';
    scatterCtx.lineWidth = 2;
    scatterCtx.stroke();
  }

}

export function writePixelValues(
  fullArray: Float32Array, sampleIndex: number, canvas: HTMLCanvasElement
): void {
  const ctx = getContext(canvas);
  // Extract image data (after Pica resize)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data; // RGBA flat array

  // Initialize channel-first tensor (3x32x32)
  const C = 3, H = 32, W = 32;
  const baseOffset = sampleIndex * C * W * H;

  // Fill the tensor: channel-first [c][h][w]
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x);
      const idx = i * 4;
      for (let j = 0; j < 3; j++) {
        const val = data[idx + j];
        if (val === undefined) {
          throw new Error(`writePixelValues: data[${idx + j}] is undefined`);
        }
        fullArray[baseOffset + j * W * H + i] = val / 255;
      }
    }
  }
}

export function drawFunction1D(
  ctx: CanvasRenderingContext2D,
  xScale: Scale,
  yScale: Scale,
  fn: (x: number) => number,
  options: DrawFunction1DOptions = {}
): void {
  const {
    stroke = 'steelblue',
    lineWidth = 1.5,
    sampleCount = Math.max(2, Math.floor(Math.abs(xScale.range[1] - xScale.range[0])))
  } = options;

  if (sampleCount < 2) {
    return;
  }

  const [domainStart, domainEnd] = xScale.domain;
  const totalRange = domainEnd - domainStart;

  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;

  let drawing = false;

  const finalizeSegment = (): void => {
    if (drawing) {
      ctx.stroke();
      drawing = false;
    }
  };

  for (let i = 0; i < sampleCount; i++) {
    const t = i / (sampleCount - 1);
    const xValue = domainStart + t * totalRange;
    const yValue = fn(xValue);

    if (!Number.isFinite(yValue)) {
      finalizeSegment();
      continue;
    }

    const canvasX = xScale(xValue);
    const canvasY = yScale(yValue);

    if (!Number.isFinite(canvasX) || !Number.isFinite(canvasY)) {
      finalizeSegment();
      continue;
    }

    if (!drawing) {
      ctx.beginPath();
      ctx.moveTo(canvasX, canvasY);
      drawing = true;
    } else {
      ctx.lineTo(canvasX, canvasY);
    }
  }

  finalizeSegment();
}
