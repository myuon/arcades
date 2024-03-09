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

const calculatePosition = (
  def: PIXI.Container,
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
  const position = new PIXI.Point(def.x, def.y);

  if (layout.left !== undefined) {
    position.x = layout.left;
  }
  if (layout.right !== undefined) {
    position.x = containerSize.width - def.width - layout.right;
  }
  if (layout.top !== undefined) {
    position.y = layout.top;
  }
  if (layout.bottom !== undefined) {
    position.y = containerSize.height - def.height - layout.bottom;
  }
  if (layout.centerX) {
    position.x = containerSize.width / 2 - def.width / 2;
  }
  if (layout.centerY) {
    position.y = containerSize.height / 2 - def.height / 2;
  }

  return position;
};

const interpolateLinearly = (t: number, from: PIXI.Point, to: PIXI.Point) => {
  return new PIXI.Point(
    from.x + (to.x - from.x) * t,
    from.y + (to.y - from.y) * t,
  );
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
  const position = calculatePosition(object, containerSize, layout);
  object.x = position.x;
  object.y = position.y;
};

export const positionInterpolated = (
  object: PIXI.Container,
  t: number,
  from: {
    containerSize: { width: number; height: number };
    layout: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
      centerX?: boolean;
      centerY?: boolean;
    };
  },
  to: {
    containerSize: { width: number; height: number };
    layout: {
      left?: number;
      right?: number;
      top?: number;
      bottom?: number;
      centerX?: boolean;
      centerY?: boolean;
    };
  },
) => {
  const start = calculatePosition(object, from.containerSize, from.layout);
  const end = calculatePosition(object, to.containerSize, to.layout);
  const position = interpolateLinearly(t, start, end);

  object.x = position.x;
  object.y = position.y;
};
