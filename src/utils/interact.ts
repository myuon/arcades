import * as PIXI from "pixi.js";

export const withOnDrag = (
  element: PIXI.DisplayObject,
  container: PIXI.Container,
  onDragMove: (event: PIXI.FederatedPointerEvent) => void,
  onDragEnd?: (event: PIXI.FederatedPointerEvent) => void,
) => {
  element.on("pointerdown", (event) => {
    event.stopPropagation();

    container.on("pointermove", onDragMove);
    container.once("pointerup", () => {
      container.off("pointermove", onDragMove);
      onDragEnd?.(event);
    });
  });
};
