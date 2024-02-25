import * as PIXI from "pixi.js";

export const intersect = (a: PIXI.Rectangle, b: PIXI.Rectangle) => {
  return (
    a.x + a.width > b.x &&
    a.x < b.x + b.width &&
    a.y + a.height > b.y &&
    a.y < b.y + b.height
  );
};

export const intesectLines = (
  a: [PIXI.Point, PIXI.Point],
  b: [PIXI.Point, PIXI.Point],
): PIXI.Point | undefined => {
  const [p1, p2] = a;
  const [p3, p4] = b;

  const denominator =
    (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) /
    denominator;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) /
    denominator;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return new PIXI.Point(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
  }
};

export const intersectRectWithLine = (
  rect: PIXI.Rectangle,
  line: [PIXI.Point, PIXI.Point],
): PIXI.Point | undefined => {
  const lines = [
    [
      new PIXI.Point(rect.x, rect.y),
      new PIXI.Point(rect.x + rect.width, rect.y),
    ],
    [
      new PIXI.Point(rect.x + rect.width, rect.y),
      new PIXI.Point(rect.x + rect.width, rect.y + rect.height),
    ],
    [
      new PIXI.Point(rect.x + rect.width, rect.y + rect.height),
      new PIXI.Point(rect.x, rect.y + rect.height),
    ],
    [
      new PIXI.Point(rect.x, rect.y + rect.height),
      new PIXI.Point(rect.x, rect.y),
    ],
  ] as [PIXI.Point, PIXI.Point][];

  let point: PIXI.Point | undefined;
  let distance = Infinity;
  for (const l of lines) {
    const p = intesectLines(l, line);
    if (p) {
      const d = (p.x - line[0].x) ** 2 + (p.y - line[0].y) ** 2;
      if (d < distance) {
        distance = d;
        point = p;
      }
    }
  }

  return point;
};
