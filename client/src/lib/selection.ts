export type SelectionRect = { x: number; y: number; width: number; height: number };

export function normalizeSelection(start: { x: number; y: number }, end: { x: number; y: number }): SelectionRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function unionSelection(first: SelectionRect, second: SelectionRect): SelectionRect {
  const x = Math.min(first.x, second.x);
  const y = Math.min(first.y, second.y);
  return {
    x,
    y,
    width: Math.max(first.x + first.width, second.x + second.width) - x,
    height: Math.max(first.y + first.height, second.y + second.height) - y,
  };
}

export function intersectsSelection(first: SelectionRect, second: SelectionRect): boolean {
  return first.x < second.x + second.width && first.x + first.width > second.x && first.y < second.y + second.height && first.y + first.height > second.y;
}

export function selectAllSelection(bounds: { width: number; height: number }): SelectionRect {
  return {
    x: 0,
    y: 0,
    width: Math.max(0, bounds.width),
    height: Math.max(0, bounds.height),
  };
}

export function invertSelectionRect(current: SelectionRect | null, bounds: { width: number; height: number }): SelectionRect {
  if (!current || current.width <= 0 || current.height <= 0) {
    return selectAllSelection(bounds);
  }
  const x = Math.max(0, bounds.width - (current.x + current.width));
  const y = Math.max(0, bounds.height - (current.y + current.height));
  return {
    x,
    y,
    width: current.width,
    height: current.height,
  };
}

export function subtractSelection(current: SelectionRect, subtractor: SelectionRect): SelectionRect | null {
  if (!intersectsSelection(current, subtractor)) {
    return current;
  }
  if (
    subtractor.x <= current.x &&
    subtractor.y <= current.y &&
    subtractor.x + subtractor.width >= current.x + current.width &&
    subtractor.y + subtractor.height >= current.y + current.height
  ) {
    return null;
  }

  const intX = Math.max(current.x, subtractor.x);
  const intY = Math.max(current.y, subtractor.y);
  const intRight = Math.min(current.x + current.width, subtractor.x + subtractor.width);
  const intBottom = Math.min(current.y + current.height, subtractor.y + subtractor.height);
  const intWidth = intRight - intX;
  const intHeight = intBottom - intY;

  if (intWidth <= 0 || intHeight <= 0) return current;

  if (intHeight >= current.height) {
    if (subtractor.x <= current.x) {
      const newX = intRight;
      const newWidth = current.x + current.width - newX;
      return newWidth > 0 ? { x: newX, y: current.y, width: newWidth, height: current.height } : null;
    } else {
      const newWidth = subtractor.x - current.x;
      return newWidth > 0 ? { x: current.x, y: current.y, width: newWidth, height: current.height } : null;
    }
  }

  if (intWidth >= current.width) {
    if (subtractor.y <= current.y) {
      const newY = intBottom;
      const newHeight = current.y + current.height - newY;
      return newHeight > 0 ? { x: current.x, y: newY, width: current.width, height: newHeight } : null;
    } else {
      const newHeight = subtractor.y - current.y;
      return newHeight > 0 ? { x: current.x, y: current.y, width: current.width, height: newHeight } : null;
    }
  }

  if (intWidth >= intHeight) {
    if (subtractor.y <= current.y) {
      const newY = intBottom;
      const newH = current.y + current.height - newY;
      return newH > 0 ? { x: current.x, y: newY, width: current.width, height: newH } : null;
    } else {
      const newH = subtractor.y - current.y;
      return newH > 0 ? { x: current.x, y: current.y, width: current.width, height: newH } : null;
    }
  } else {
    if (subtractor.x <= current.x) {
      const newX = intRight;
      const newW = current.x + current.width - newX;
      return newW > 0 ? { x: newX, y: current.y, width: newW, height: current.height } : null;
    } else {
      const newW = subtractor.x - current.x;
      return newW > 0 ? { x: current.x, y: current.y, width: newW, height: current.height } : null;
    }
  }
}

export function featherSelection(selection: SelectionRect, radius: number, bounds: { width: number; height: number }): SelectionRect {
  const x = Math.max(0, Math.round(selection.x - radius));
  const y = Math.max(0, Math.round(selection.y - radius));
  const width = Math.min(bounds.width - x, Math.round(selection.width + radius * 2));
  const height = Math.min(bounds.height - y, Math.round(selection.height + radius * 2));
  return { x, y, width, height };
}

