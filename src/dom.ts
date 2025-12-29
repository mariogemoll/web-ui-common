type HTMLElementGenerator<T> = (
  attrs?: Record<string, string>, style?: Partial<CSSStyleDeclaration>
) => T;
type HTMLElementAdder<T> = (
  parent: HTMLElement, attrs?: Record<string, string>, style?: Partial<CSSStyleDeclaration>
) => T;

export function el(parent: Document | Element, query: string): Element {
  const element = parent.querySelector(query);
  if (!element) {
    throw new Error(`Element for query ${query} not found`);
  }
  return element;
}

export function makeEl(
  tagName: string, attrs: Record<string, string> = {}, style: Partial<CSSStyleDeclaration> = {}
): HTMLElement {
  const el = document.createElement(tagName);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  Object.assign(el.style, style);
  return el;
}

export function addEl(
  parent: HTMLElement,
  tagName: string,
  attrs: Record<string, string> = {},
  style: Partial<CSSStyleDeclaration> = {}
): HTMLElement {
  const el = makeEl(tagName, attrs, style);
  parent.appendChild(el);
  return el;
}

export function removePlaceholder(container: HTMLElement): void {
  const placeholder = container.querySelector('.placeholder');
  if (placeholder !== null) {
    placeholder.remove();
  }
}

export function addText(parent: HTMLElement, text: string): Text {
  const textNode = document.createTextNode(text);
  parent.appendChild(textNode);
  return textNode;
}

export function addOption(
  select: HTMLSelectElement, value: string, text: string
): HTMLOptionElement {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  select.appendChild(option);
  return option;
}

// make* functions (alphabetical)

export const makeButton: HTMLElementGenerator<HTMLButtonElement> = (attrs = {}, style = {}) => (
  makeEl('button', attrs, style) as HTMLButtonElement
);

export const makeCanvas: HTMLElementGenerator<HTMLCanvasElement> = (attrs = {}, style = {}) => (
  makeEl('canvas', attrs, style) as HTMLCanvasElement
);

export const makeDiv: HTMLElementGenerator<HTMLDivElement> = (attrs = {}, style = {}) => (
  makeEl('div', attrs, style) as HTMLDivElement
);

export const makeInput: HTMLElementGenerator<HTMLInputElement> = (attrs = {}, style = {}) => (
  makeEl('input', attrs, style) as HTMLInputElement
);

export const makeLabel: HTMLElementGenerator<HTMLLabelElement> = (attrs = {}, style = {}) => (
  makeEl('label', attrs, style) as HTMLLabelElement
);

export const makeSelect: HTMLElementGenerator<HTMLSelectElement> = (attrs = {}, style = {}) => (
  makeEl('select', attrs, style) as HTMLSelectElement
);

export const makeSpan: HTMLElementGenerator<HTMLSpanElement> = (attrs = {}, style = {}) => (
  makeEl('span', attrs, style) as HTMLSpanElement
);

// add* functions (alphabetical)

export const addButton: HTMLElementAdder<HTMLButtonElement> = (parent, attrs = {}, style = {}) => (
  addEl(parent, 'button', attrs, style) as HTMLButtonElement
);

export const addCanvas: HTMLElementAdder<HTMLCanvasElement> = (parent, attrs = {}, style = {}) => (
  addEl(parent, 'canvas', attrs, style) as HTMLCanvasElement
);

export const addDiv: HTMLElementAdder<HTMLDivElement> = (parent, attrs = {}, style = {}) => (
  addEl(parent, 'div', attrs, style) as HTMLDivElement
);

export const addInput: HTMLElementAdder<HTMLInputElement> = (parent, attrs = {}, style = {}) => (
  addEl(parent, 'input', attrs, style) as HTMLInputElement
);

export const addLabel: HTMLElementAdder<HTMLLabelElement> = (parent, attrs = {}, style = {}) => (
  addEl(parent, 'label', attrs, style) as HTMLLabelElement
);

export const addSelect: HTMLElementAdder<HTMLSelectElement> = (parent, attrs = {}, style = {}) => (
  addEl(parent, 'select', attrs, style) as HTMLSelectElement
);

export const addSpan: HTMLElementAdder<HTMLSpanElement> = (parent, attrs = {}, style = {}) => (
  addEl(parent, 'span', attrs, style) as HTMLSpanElement
);

export const addTd: HTMLElementAdder<HTMLTableCellElement> = (parent, attrs = {}, style = {}) => (
  addEl(parent, 'td', attrs, style) as HTMLTableCellElement
);
