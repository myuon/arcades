import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import { intersectRectWithLine } from "../utils/intersect";

const main = () => {
  const app = new PIXI.Application({ width: 500, height: 500 });

  const wall = new PIXI.Graphics();
  wall.beginFill(0x0099ff);
  wall.drawRect(0, 0, 200, 200);
  wall.endFill();
  wall.x = 150;
  wall.y = 150;
  app.stage.addChild(wall);

  const light = new PIXI.Graphics();
  light.beginFill(0xffff00);
  light.drawRect(0, 0, 20, 20);
  light.endFill();
  light.x = 50;
  light.y = 50;
  light.eventMode = "static";

  let dragTarget: PIXI.Graphics | null = null;
  light.on("pointerdown", () => {
    dragTarget = light;

    app.stage.on(
      "pointermove",
      (e) => {
        if (dragTarget) {
          dragTarget.position.copyFrom(e.global);
        }
      },
      light,
    );
  });
  light.on("pointerup", () => {
    dragTarget = null;
  });
  app.stage.addChild(light);

  const intesectPoint = new PIXI.Graphics();
  intesectPoint.beginFill(0xff0000);
  intesectPoint.drawCircle(0, 0, 5);
  intesectPoint.endFill();
  intesectPoint.visible = false;
  app.stage.addChild(intesectPoint);

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const lightray = new PIXI.Graphics();
  app.stage.addChild(lightray);

  app.stage.on("pointermove", (e) => {
    lightray.clear();
    lightray.lineStyle(2, 0xffff00);
    lightray.moveTo(light.x + light.width / 2, light.y + light.height / 2);
    lightray.lineTo(e.global.x, e.global.y);

    const p = intersectRectWithLine(wall.getBounds(), [
      new PIXI.Point(light.x + light.width / 2, light.y + light.height / 2),
      new PIXI.Point(e.global.x, e.global.y),
    ]);

    if (p) {
      wall.clear();
      wall.beginFill(0x00ff00);
      wall.drawRect(0, 0, 200, 200);
      wall.endFill();

      intesectPoint.visible = true;
      intesectPoint.position.copyFrom(p);
    } else {
      wall.clear();
      wall.beginFill(0x0099ff);
      wall.drawRect(0, 0, 200, 200);
      wall.endFill();

      intesectPoint.visible = false;
    }
  });

  return app;
};

export default function Page() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const app = main();
    ref.current?.replaceChildren(app.view as unknown as Node);

    return () => {
      app.destroy();
    };
  }, []);

  return <div ref={ref} />;
}
