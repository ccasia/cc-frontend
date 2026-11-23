// OCR boxes are close but often too narrow or loose. Snap each box to the real text pixels around it.

const INK_THRESHOLD = 70;

const luminance = (data, i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

const backgroundLuminance = ({ data, width }, x0, x1, y0, y1) => {
  const bins = new Array(32).fill(0);
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) bins[Math.floor(luminance(data, (y * width + x) * 4) / 8)] += 1;
  }
  return bins.indexOf(Math.max(...bins)) * 8 + 4;
};

export function snapBox(image, box) {
  const { data, width, height } = image;
  const clampX = (x) => Math.max(0, Math.min(width, x));
  const clampY = (y) => Math.max(0, Math.min(height, y));

  const [ymin, xmin, ymax, xmax] = box;
  const x0 = Math.round((xmin / 1000) * width);
  const x1 = Math.round((xmax / 1000) * width);
  const y0 = Math.round((ymin / 1000) * height);
  const y1 = Math.round((ymax / 1000) * height);
  const h = Math.max(4, y1 - y0);

  const win = { x0: clampX(x0 - 3 * h), x1: clampX(x1 + 3 * h), y0: clampY(y0 - h), y1: clampY(y1 + h) };
  const bg = backgroundLuminance(image, win.x0, win.x1, win.y0, win.y1);
  const isInk = (x, y) => Math.abs(luminance(data, (y * width + x) * 4) - bg) > INK_THRESHOLD;

  const colHasInk = (x, ya, yb) => {
    for (let y = ya; y < yb; y += 1) if (isInk(x, y)) return true;
    return false;
  };
  const rowHasInk = (y, xa, xb) => {
    for (let x = xa; x <= xb; x += 1) if (isInk(x, y)) return true;
    return false;
  };

  const seedCols = [];
  for (let x = clampX(x0); x < clampX(x1); x += 1) if (colHasInk(x, clampY(y0), clampY(y1))) seedCols.push(x);
  if (!seedCols.length) return box;

  const gapX = Math.max(2, Math.round(h * 0.5));
  const expand = (start, dir, limit, gapMax, hasInk) => {
    let edge = start;
    let gap = 0;
    for (let i = start + dir; dir > 0 ? i < limit : i >= limit; i += dir) {
      if (hasInk(i)) {
        edge = i;
        gap = 0;
      } else {
        gap += 1;
        if (gap > gapMax) break;
      }
    }
    return edge;
  };

  const left = expand(seedCols[0], -1, win.x0, gapX, (x) => colHasInk(x, clampY(y0), clampY(y1)));
  const right = expand(seedCols[seedCols.length - 1], 1, win.x1, gapX, (x) => colHasInk(x, clampY(y0), clampY(y1)));

  const seedRows = [];
  for (let y = clampY(y0); y < clampY(y1); y += 1) if (rowHasInk(y, left, right)) seedRows.push(y);
  if (!seedRows.length) return box;

  const gapY = Math.max(1, Math.round(h * 0.15));
  const top = expand(seedRows[0], -1, win.y0, gapY, (y) => rowHasInk(y, left, right));
  const bottom = expand(seedRows[seedRows.length - 1], 1, win.y1, gapY, (y) => rowHasInk(y, left, right));

  return [
    Math.round((top / height) * 1000),
    Math.round((left / width) * 1000),
    Math.round(((bottom + 1) / height) * 1000),
    Math.round(((right + 1) / width) * 1000),
  ];
}
