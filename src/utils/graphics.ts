import * as PIXI from "pixi.js";

export const createGraphics = (
  parts: string[],
  color: PIXI.ColorSource = 0xff99ff,
  size = 28,
) => {
  const graphics = new PIXI.Graphics();
  const cellSize = size / parts.length;

  for (let y = 0; y < parts.length; y++) {
    for (let x = 0; x < parts[y].length; x++) {
      if (parts[y][x] === "l") {
        graphics.beginFill(color);
        graphics.drawRect(x * cellSize, y * cellSize, cellSize, cellSize);
        graphics.endFill();
      }
    }
  }

  return graphics;
};

export const centerOf = (graphics: PIXI.Graphics) => {
  return new PIXI.Point(
    graphics.x + graphics.width / 2,
    graphics.y + graphics.height / 2,
  );
};
