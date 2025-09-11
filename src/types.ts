export type Pair<T> = [T, T];

export interface Scale {
  (value: number): number;
  domain: Pair<number>;
  range: Pair<number>;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
