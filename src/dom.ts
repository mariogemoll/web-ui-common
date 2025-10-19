export function el(parent: Document | Element, query: string): Element {
  const element = parent.querySelector(query);
  if (!element) {
    throw new Error(`Element for query ${query} not found`);
  }
  return element;
}

export function removePlaceholder(container: HTMLElement): void {
  const placeholder = container.querySelector('.placeholder');
  if (placeholder !== null) {
    placeholder.remove();
  }
}
