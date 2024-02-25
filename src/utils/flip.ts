import * as PIXI from "pixi.js";

export const flipByLine = (
  point: PIXI.Point,
  line: [PIXI.Point, PIXI.Point],
) => {
  const [l1, l2] = line;
  const pl1 = new PIXI.Point(l1.x - point.x, l1.y - point.y);
  const l1l2 = new PIXI.Point(l2.x - l1.x, l2.y - l1.y);

  const t = -(pl1.x * l1l2.x + pl1.y * l1l2.y) / (l1l2.x ** 2 + l1l2.y ** 2);
  const n = new PIXI.Point(l1.x + l1l2.x * t, l1.y + l1l2.y * t);
  const pn = new PIXI.Point(n.x - point.x, n.y - point.y);

  return new PIXI.Point(point.x + 2 * pn.x, point.y + 2 * pn.y);
};
