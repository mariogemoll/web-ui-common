import {
  addFrameUsingScales,
  createMovableDot,
  drawFunction1D,
  drawLine,
  drawScatter,
  getContext } from './canvas';
import { addCanvas, el } from './dom';
import type { Pair } from './types';
import { makeScale } from './util';

// Demo 1: Line chart
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

// Demo 2: Scatter plot
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

// Demo 3: Function plotting
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

// Demo 4: Synced movable dots
function createSyncedDots(): void {
  const container = el(document, '#synced-dots-container') as HTMLElement;

  // Create first canvas
  const canvas1 = addCanvas(container, { width: '400', height: '400' });
  const ctx1 = getContext(canvas1);

  // Create second canvas
  const canvas2 = addCanvas(container, { width: '400', height: '400' });
  const ctx2 = getContext(canvas2);

  // Create scales (shared by both canvases)
  const xScale = makeScale([0, 10], [40, 360]);
  const yScale = makeScale([0, 10], [360, 40]);

  // Redraw function that draws both canvases
  const redrawAll = (position: Pair<number>): void => {
    // Clear both canvases
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    // Draw frames
    addFrameUsingScales(ctx1, xScale, yScale, 6);
    addFrameUsingScales(ctx2, xScale, yScale, 6);

    // Draw dots
    dot1.render(position);
    dot2.render(position);
  };

  // Create movable dots with onChange callbacks that redraw both
  const dot1 = createMovableDot(canvas1, ctx1, xScale, yScale, [5, 5], {
    radius: 8,
    fill: 'steelblue',
    onChange: redrawAll
  });

  const dot2 = createMovableDot(canvas2, ctx2, xScale, yScale, [5, 5], {
    radius: 8,
    fill: 'crimson',
    onChange: redrawAll
  });

  // Initial draw
  addFrameUsingScales(ctx1, xScale, yScale, 6);
  addFrameUsingScales(ctx2, xScale, yScale, 6);

  // Add info text
  const info = document.createElement('p');
  info.textContent = 'Drag the dot on either canvas - both will stay synchronized!';
  info.style.marginTop = '10px';
  info.style.color = '#666';
  info.style.fontStyle = 'italic';
  container.appendChild(info);
}

// Initialize all demos
function init(): void {
  createLineChart();
  createScatterPlot();
  createFunctionPlot();
  createSyncedDots();
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
