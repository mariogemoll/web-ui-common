import {
  addFrameUsingScales,
  drawFunction1D,
  drawLine,
  drawScatter,
  getContext } from './canvas';
import { addCanvas, el } from './dom';
import type { Pair } from './types';
import { makeScale } from './util';

// Demo 1: Line Chart
function createLineChart(): void {
  const container = el(document, '#line-chart-container') as HTMLElement;
  const canvas = addCanvas(container, { width: '800', height: '400' });
  const ctx = getContext(canvas);

  // Create scales
  const xScale = makeScale([0, 10], [60, 740]);
  const yScale = makeScale([0, 100], [340, 60]);

  // Draw frame with axes
  addFrameUsingScales(ctx, xScale, yScale, 6);

  // Generate some sample data
  const dataPoints: Pair<number>[] = [
    [0, 20],
    [1, 35],
    [2, 28],
    [3, 52],
    [4, 65],
    [5, 58],
    [6, 72],
    [7, 80],
    [8, 75],
    [9, 88],
    [10, 92]
  ];

  // Draw line with fill
  drawLine(ctx, xScale, yScale, dataPoints, {
    stroke: 'steelblue',
    lineWidth: 2,
    fill: 'rgba(70, 130, 180, 0.2)'
  });
}

// Demo 2: Scatter Plot
function createScatterPlot(): void {
  const container = el(document, '#scatter-plot-container') as HTMLElement;
  const canvas = addCanvas(container, { width: '800', height: '400' });
  const ctx = getContext(canvas);

  // Create scales
  const xScale = makeScale([0, 10], [60, 740]);
  const yScale = makeScale([0, 10], [340, 60]);

  // Draw frame with axes
  addFrameUsingScales(ctx, xScale, yScale, 6);

  // Generate random scatter data
  const coords: Pair<number>[] = [];
  const colors: string[] = [];

  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 10;
    const y = Math.random() * 10;
    coords.push([x, y]);

    // Color points based on their position
    const hue = Math.floor((x / 10) * 360);
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }

  // Draw scatter points
  drawScatter(ctx, xScale, yScale, coords, colors, undefined, {
    radius: 4,
    alpha: 0.7
  });
}

// Demo 3: Function Plotting
function createFunctionPlot(): void {
  const container = el(document, '#function-plot-container') as HTMLElement;
  const canvas = addCanvas(container, { width: '800', height: '400' });

  function plotFunction(fn: (x: number) => number, color: string, label: string): void {
    const ctx = getContext(canvas);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create scales
    const xScale = makeScale([-2 * Math.PI, 2 * Math.PI], [60, 740]);
    const yScale = makeScale([-1.5, 1.5], [340, 60]);

    // Draw frame with axes
    addFrameUsingScales(ctx, xScale, yScale, 7);

    // Draw function
    drawFunction1D(ctx, xScale, yScale, fn, {
      stroke: color,
      lineWidth: 2.5
    });

    // Add title
    ctx.fillStyle = '#333';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 70, 35);
  }

  // Set up button handlers
  const btnSine = el(document, '#plot-sine') as HTMLButtonElement;
  const btnCosine = el(document, '#plot-cosine') as HTMLButtonElement;
  const btnQuadratic = el(document, '#plot-quadratic') as HTMLButtonElement;

  btnSine.onclick = (): void => { plotFunction(Math.sin, 'crimson', 'y = sin(x)'); };
  btnCosine.onclick = (): void => { plotFunction(Math.cos, 'darkblue', 'y = cos(x)'); };
  btnQuadratic.onclick = (): void => { plotFunction(x => x * x / 10, 'darkgreen', 'y = x²/10'); };

  // Plot sine by default
  plotFunction(Math.sin, 'crimson', 'y = sin(x)');
}

// Initialize all demos
function init(): void {
  createLineChart();
  createScatterPlot();
  createFunctionPlot();
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
