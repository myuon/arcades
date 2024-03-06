import * as PIXI from "pixi.js";

export const norm = (v: PIXI.Point) => Math.sqrt(v.x ** 2 + v.y ** 2);

export const normalize = (v: PIXI.Point) => {
  const length = norm(v);
  return new PIXI.Point(v.x / length, v.y / length);
};

export const scale = (v: PIXI.Point, s: number) =>
  new PIXI.Point(v.x * s, v.y * s);
