import * as PIXI from "pixi.js";

export const createGraphics = (parts: string[]) => {
  const graphics = new PIXI.Graphics();
  const cellSize = 28 / parts.length;

  for (let y = 0; y < parts.length; y++) {
    for (let x = 0; x < parts[y].length; x++) {
      if (parts[y][x] === "l") {
        graphics.beginFill(0xff99ff);
        graphics.drawRect(x * cellSize, y * cellSize, cellSize, cellSize);
        graphics.endFill();
      }
    }
  }

  return graphics;
};
