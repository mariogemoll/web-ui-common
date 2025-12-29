import { addCanvas, addDiv, el } from './dom';
import type { Pair, Scale } from './types';
import { generateTicks, makeScale } from './util';
import {
  clearWebGl,
  createLineRenderer,
  drawAxesThroughOriginWebGl,
  drawCirclesWebGl,
  drawFrameUsingScalesWebGl,
  drawFunction1DWebGl,
  drawGridLinesWebGl,
  drawPolylineWebGlThick,
  getWebGlContext,
  withScissorRegionFromScales
} from './webgl';

// TODO: Consider moving this to a library function in the future for reusability
// This function renders axis labels using HTML positioned absolutely over the canvas
function setFrameLabelsHTML(
  labelLayer: HTMLElement,
  xScale: Scale,
  yScale: Scale,
  numTicks: number
): void {
  labelLayer.innerHTML = '';

  const xTicks = generateTicks(xScale.domain, numTicks);
  const yTicks = generateTicks(yScale.domain, numTicks);

  for (const tickValue of xTicks) {
    const x = xScale(tickValue);
    const y = yScale.range[0] + 18;
    const label = document.createElement('div');
    label.textContent = tickValue.toFixed(1);
    label.style.position = 'absolute';
    label.style.left = `${x.toString()}px`;
    label.style.top = `${y.toString()}px`;
    label.style.transform = 'translate(-50%, -50%)';
    label.style.fontSize = '10px';
    label.style.fontFamily = 'sans-serif';
    label.style.color = 'black';
    label.style.whiteSpace = 'nowrap';
    labelLayer.appendChild(label);
  }

  for (const tickValue of yTicks) {
    const x = xScale.range[0] - 9;
    const y = yScale(tickValue) + 3;
    const label = document.createElement('div');
    label.textContent = tickValue.toFixed(1);
    label.style.position = 'absolute';
    label.style.left = `${x.toString()}px`;
    label.style.top = `${y.toString()}px`;
    label.style.transform = 'translate(-100%, -50%)';
    label.style.fontSize = '10px';
    label.style.fontFamily = 'sans-serif';
    label.style.color = 'black';
    label.style.whiteSpace = 'nowrap';
    labelLayer.appendChild(label);
  }
}

function createWebGlFrameDemo(): void {
  const container = el(document, '#WebGL-frame-container') as HTMLElement;

  const wrapper = addDiv(container, {}, {
    position: 'relative',
    width: '800px',
    height: '400px',
    border: '1px solid #ddd'
  });

  const glCanvas = addCanvas(wrapper, { width: '800', height: '400' }, {
    position: 'absolute',
    left: '0',
    top: '0'
  });

  const labelLayer = addDiv(wrapper, {}, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  });

  const gl = getWebGlContext(glCanvas);
  const lineRenderer = createLineRenderer(gl);

  const xScale = makeScale([0, 10], [60, 740]);
  const yScale = makeScale([0, 100], [340, 60]);

  clearWebGl(gl, [1, 1, 1, 1]);

  drawGridLinesWebGl(lineRenderer, xScale, yScale, 6);
  drawFrameUsingScalesWebGl(lineRenderer, xScale, yScale, 6);
  setFrameLabelsHTML(labelLayer, xScale, yScale, 6);
}

function createWebGlLineChart(): void {
  const container = el(document, '#WebGL-line-chart-container') as HTMLElement;

  const wrapper = addDiv(container, {}, {
    position: 'relative',
    width: '800px',
    height: '400px',
    border: '1px solid #ddd'
  });

  const glCanvas = addCanvas(wrapper, { width: '800', height: '400' }, {
    position: 'absolute',
    left: '0',
    top: '0'
  });

  const labelLayer = addDiv(wrapper, {}, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  });

  const gl = getWebGlContext(glCanvas);
  const lineRenderer = createLineRenderer(gl);

  const xScale = makeScale([0, 10], [60, 740]);
  const yScale = makeScale([0, 100], [340, 60]);

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

  const points: Pair<number>[] = [];
  for (const [xValue, yValue] of dataPoints) {
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

  clearWebGl(gl, [1, 1, 1, 1]);

  drawGridLinesWebGl(lineRenderer, xScale, yScale, 6);
  drawFrameUsingScalesWebGl(lineRenderer, xScale, yScale, 6);
  setFrameLabelsHTML(labelLayer, xScale, yScale, 6);

  drawPolylineWebGlThick(lineRenderer, points, 'steelblue', 2);
}

function createWebGlScatterPlot(): void {
  const container = el(document, '#WebGL-scatter-container') as HTMLElement;

  const wrapper = addDiv(container, {}, {
    position: 'relative',
    width: '800px',
    height: '400px',
    border: '1px solid #ddd'
  });

  const glCanvas = addCanvas(wrapper, { width: '800', height: '400' }, {
    position: 'absolute',
    left: '0',
    top: '0'
  });

  const labelLayer = addDiv(wrapper, {}, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  });

  const gl = getWebGlContext(glCanvas);
  const lineRenderer = createLineRenderer(gl);

  const xScale = makeScale([0, 10], [60, 740]);
  const yScale = makeScale([0, 10], [340, 60]);

  const coords: Pair<number>[] = [];
  const colors: string[] = [];
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 10;
    const y = Math.random() * 10;
    coords.push([xScale(x), yScale(y)]);
    const hue = Math.floor((x / 10) * 360);
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }

  clearWebGl(gl, [1, 1, 1, 1]);
  drawGridLinesWebGl(lineRenderer, xScale, yScale, 6);
  drawFrameUsingScalesWebGl(lineRenderer, xScale, yScale, 6);
  setFrameLabelsHTML(labelLayer, xScale, yScale, 6);

  drawCirclesWebGl(lineRenderer, coords, 'rgba(70, 130, 180, 0.7)', 4, 24, colors);
}

function createWebGlFunctionPlot(): void {
  const container = el(document, '#WebGL-function-plot-container') as HTMLElement;

  const wrapper = addDiv(container, {}, {
    position: 'relative',
    width: '800px',
    height: '400px',
    border: '1px solid #ddd'
  });

  const glCanvas = addCanvas(wrapper, { width: '800', height: '400' }, {
    position: 'absolute',
    left: '0',
    top: '0'
  });

  const labelLayer = addDiv(wrapper, {}, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  });

  const gl = getWebGlContext(glCanvas);
  const lineRenderer = createLineRenderer(gl);

  const xScale = makeScale([-2 * Math.PI, 2 * Math.PI], [60, 740]);
  const yScale = makeScale([-1.5, 1.5], [340, 60]);

  const label = el(document, '#WebGL-function-label') as HTMLElement;

  function plotFunction(fn: (x: number) => number, color: string, labelText: string): void {
    clearWebGl(gl, [1, 1, 1, 1]);
    drawGridLinesWebGl(lineRenderer, xScale, yScale, 7);
    drawFrameUsingScalesWebGl(lineRenderer, xScale, yScale, 7);
    setFrameLabelsHTML(labelLayer, xScale, yScale, 7);
    drawFunction1DWebGl(lineRenderer, xScale, yScale, fn, { stroke: color });
    label.textContent = labelText;
  }

  const btnSine = el(document, '#WebGL-plot-sine') as HTMLButtonElement;
  const btnCosine = el(document, '#WebGL-plot-cosine') as HTMLButtonElement;
  const btnQuadratic = el(document, '#WebGL-plot-quadratic') as HTMLButtonElement;

  btnSine.onclick = (): void => { plotFunction(Math.sin, 'crimson', 'y = sin(x)'); };
  btnCosine.onclick = (): void => { plotFunction(Math.cos, 'darkblue', 'y = cos(x)'); };
  btnQuadratic.onclick = (): void => { plotFunction(x => x * x / 10, 'darkgreen', 'y = x^2/10'); };

  plotFunction(Math.sin, 'crimson', 'y = sin(x)');
}

function createWebGlCenteredPlot(): void {
  const container = el(document, '#WebGL-centered-plot-container') as HTMLElement;

  const wrapper = addDiv(container, {}, {
    position: 'relative',
    width: '800px',
    height: '400px',
    border: '1px solid #ddd'
  });

  const glCanvas = addCanvas(wrapper, { width: '800', height: '400' }, {
    position: 'absolute',
    left: '0',
    top: '0'
  });

  const labelLayer = addDiv(wrapper, {}, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  });

  const gl = getWebGlContext(glCanvas);
  const lineRenderer = createLineRenderer(gl);

  const xScale = makeScale([-5, 5], [60, 740]);
  const yScale = makeScale([-3, 3], [340, 60]);

  clearWebGl(gl, [1, 1, 1, 1]);
  drawGridLinesWebGl(lineRenderer, xScale, yScale, 6);
  drawFrameUsingScalesWebGl(lineRenderer, xScale, yScale, 6);
  setFrameLabelsHTML(labelLayer, xScale, yScale, 6);
  drawAxesThroughOriginWebGl(lineRenderer, xScale, yScale, {
    showTicks: true,
    numTicks: 6,
    color: 'black'
  });

  withScissorRegionFromScales(gl, xScale, yScale, () => {
    const circlePoints: Pair<number>[] = [];
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * 2 * Math.PI;
      const x = 2 * Math.cos(angle);
      const y = 2 * Math.sin(angle);
      circlePoints.push([xScale(x), yScale(y)]);
    }
    drawPolylineWebGlThick(lineRenderer, circlePoints, 'crimson', 2);
    drawFunction1DWebGl(
      lineRenderer,
      xScale,
      yScale,
      (x) => (x * x) / 2 - 2,
      { stroke: 'darkgreen' }
    );
  });
}

function createWebGlSyncedDots(): void {
  const container = el(document, '#WebGL-synced-dots-container') as HTMLElement;

  const wrapper1 = addDiv(container, {}, {
    position: 'relative',
    width: '400px',
    height: '400px',
    border: '1px solid #ddd'
  });

  const glCanvas1 = addCanvas(wrapper1, { width: '400', height: '400' }, {
    position: 'absolute',
    left: '0',
    top: '0'
  });

  const labelLayer1 = addDiv(wrapper1, {}, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  });

  const wrapper2 = addDiv(container, {}, {
    position: 'relative',
    width: '400px',
    height: '400px',
    border: '1px solid #ddd'
  });

  const glCanvas2 = addCanvas(wrapper2, { width: '400', height: '400' }, {
    position: 'absolute',
    left: '0',
    top: '0'
  });

  const labelLayer2 = addDiv(wrapper2, {}, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  });

  const gl1 = getWebGlContext(glCanvas1);
  const lineRenderer1 = createLineRenderer(gl1);

  const gl2 = getWebGlContext(glCanvas2);
  const lineRenderer2 = createLineRenderer(gl2);

  const xScale = makeScale([0, 10], [40, 360]);
  const yScale = makeScale([0, 10], [360, 40]);

  let position: Pair<number> = [5, 5];
  setFrameLabelsHTML(labelLayer1, xScale, yScale, 6);
  setFrameLabelsHTML(labelLayer2, xScale, yScale, 6);

  const redrawAll = (): void => {
    clearWebGl(gl1, [1, 1, 1, 1]);
    drawFrameUsingScalesWebGl(lineRenderer1, xScale, yScale, 6);

    clearWebGl(gl2, [1, 1, 1, 1]);
    drawFrameUsingScalesWebGl(lineRenderer2, xScale, yScale, 6);

    const point1: Pair<number> = [xScale(position[0]), yScale(position[1])];
    const point2: Pair<number> = [xScale(position[0]), yScale(position[1])];
    drawCirclesWebGl(lineRenderer1, [point1], 'steelblue', 8, 32);
    drawCirclesWebGl(lineRenderer2, [point2], 'crimson', 8, 32);
  };

  function getCoords(
    canvas: HTMLCanvasElement,
    event: MouseEvent | TouchEvent
  ): Pair<number> | null {
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent && event.touches.length > 0) {
      const touch = event.touches[0];
      if (!touch) {
        return null;
      }
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      return null;
    }

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    const dataX = xScale.inverse(screenX);
    const dataY = yScale.inverse(screenY);

    return [dataX, dataY];
  }

  function attachDragHandlers(canvas: HTMLCanvasElement): void {
    let isDragging = false;

    const startDrag = (event: MouseEvent | TouchEvent): void => {
      const coords = getCoords(canvas, event);
      if (!coords) {
        return;
      }
      isDragging = true;
      position = coords;
      redrawAll();
      event.preventDefault();
    };

    const moveDrag = (event: MouseEvent | TouchEvent): void => {
      if (!isDragging) {
        return;
      }
      const coords = getCoords(canvas, event);
      if (!coords) {
        return;
      }
      position = coords;
      redrawAll();
      event.preventDefault();
    };

    const endDrag = (): void => {
      isDragging = false;
    };

    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', moveDrag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);

    canvas.addEventListener('touchstart', startDrag);
    canvas.addEventListener('touchmove', moveDrag);
    canvas.addEventListener('touchend', endDrag);
    canvas.addEventListener('touchcancel', endDrag);
  }

  attachDragHandlers(glCanvas1);
  attachDragHandlers(glCanvas2);

  redrawAll();

  const info = document.createElement('p');
  info.textContent = 'Drag the dot on either canvas - both will stay synchronized!';
  info.style.marginTop = '10px';
  info.style.color = '#666';
  info.style.fontStyle = 'italic';
  container.appendChild(info);
}

function init(): void {
  createWebGlFrameDemo();
  createWebGlLineChart();
  createWebGlScatterPlot();
  createWebGlFunctionPlot();
  createWebGlCenteredPlot();
  createWebGlSyncedDots();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
