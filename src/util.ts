import type { Pair, Scale } from './types';

export function at<T>(arr: T[], idx: number): T {
  const el = arr[idx];
  if (el === undefined) {
    throw new Error(`atIdx: Element at index ${idx} is undefined`);
  }
  return el;
}

// function that maps from [0, 1] to range [a, b]
export function map01ToRange(range: Pair<number>, value: number): number {
  const [min, max] = range;
  return min + value * (max - min);
}

// function that maps a value from range a to range b
export function mapRange(fromRange: Pair<number>, toRange: Pair<number>, value: number): number {
  const [fromMin, fromMax] = fromRange;
  const [toMin, toMax] = toRange;
  return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
}

export function mapRangeTo01(range: Pair<number>, value: number): number {
  const mapped = mapRange(range, [0, 1], value);
  return Math.max(0, Math.min(1, mapped)); // Clamp to [0, 1]
}

export function midRangeValue(range: Pair<number>): number {
  const [min, max] = range;
  return (min + max) / 2;
}

export function makeScale(domain: Pair<number>, range: Pair<number>): Scale {
  const fnc = mapRange.bind(null, domain, range) as Scale;
  fnc.domain = domain;
  fnc.range = range;
  fnc.inverse = mapRange.bind(null, range, domain);
  return fnc;
}

// Function to add a percentual margin to range [a, b]
export function addMarginToRange(range: Pair<number>, marginFraction: number): [number, number] {
  const [min, max] = range;
  const rangeSize = max - min;
  const margin = rangeSize * marginFraction;
  return [min - margin, max + margin];
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number, k = (n + h * 6) % 6): number =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [f(5), f(3), f(1)];
}

export function mapPair<T, U>(fn: (value: T) => U, pair: Pair<T>): Pair<U> {
  return [fn(pair[0]), fn(pair[1])];
}

export function getAttribute(element: Element, attribute: string): string {
  const value = element.getAttribute(attribute);
  if (value === null) {
    throw new Error(`Attribute "${attribute}" not found on element.`);
  }
  return value;
}

export function generateTicks(range: [number, number], count: number): number[] {
  const [min, max] = range;
  const step = (max - min) / (count - 1);
  const tickValues: number[] = [];

  for (let i = 0; i < count; i++) {
    tickValues.push(min + i * step);
  }

  return tickValues;
}

export function floorString(value: number): string {
  return Math.floor(value).toString();
}
