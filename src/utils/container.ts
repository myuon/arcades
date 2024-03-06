import * as PIXI from "pixi.js";

export const asContainer = (...objects: PIXI.DisplayObject[]) => {
  const container = new PIXI.Container();
  for (const object of objects) {
    container.addChild(object);
  }

  return container;
};

export const arrangeHorizontal = (
  object: PIXI.Container,
  options: {
    align: "left" | "center";
    gap: number;
  },
) => {
  let y = 0;
  for (const child of object.children) {
    const bounds = child.getBounds();
    child.y = y;
    y += bounds.height + options.gap;

    if (options.align === "center") {
      child.x = object.width / 2 - bounds.width / 2;
    }
  }
};

export const centerize = (
  object: PIXI.Container,
  containerSize: { width: number; height: number },
) => {
  object.x = containerSize.width / 2 - object.width / 2;
  object.y = containerSize.height / 2 - object.height / 2;
};

export const position = (
  object: PIXI.Container,
  containerSize: { width: number; height: number },
  layout: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    centerX?: boolean;
    centerY?: boolean;
  },
) => {
  if (layout.left !== undefined) {
    object.x = layout.left;
  }
  if (layout.right !== undefined) {
    object.x = containerSize.width - object.width - layout.right;
  }
  if (layout.top !== undefined) {
    object.y = layout.top;
  }
  if (layout.bottom !== undefined) {
    object.y = containerSize.height - object.height - layout.bottom;
  }
  if (layout.centerX) {
    object.x = containerSize.width / 2 - object.width / 2;
  }
  if (layout.centerY) {
    object.y = containerSize.height / 2 - object.height / 2;
  }
};
