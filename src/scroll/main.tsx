import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";

const keysPressed: { [key: string]: boolean } = {};
const keysPressing: { [key: string]: number } = {};

const main = () => {
  const canvasSize = { width: 500, height: 500 };
  const app = new PIXI.Application({
    width: canvasSize.width,
    height: canvasSize.height,
  });
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.sortableChildren = true;

  interface Resource {
    x: number;
    y: number;
    color: number;
    dom: PIXI.Graphics;
  }

  const model: Resource[] = [];
  const add = (r: Partial<Resource>) => {
    const dom = new PIXI.Graphics();
    dom.beginFill(r.color || 0xff0000);
    dom.drawRect(0, 0, 50, 50);
    dom.endFill();
    dom.position.set(r.x || 0, r.y || 0);
    dom.zIndex = 1;

    app.stage.addChild(dom);
    model.push({ x: r.x || 0, y: r.y || 0, dom, color: r.color || 0xff0000 });
  };
  const reposition = () => {
    for (const r of model) {
      r.dom.position.set(r.x - mapPoint.x, r.y - mapPoint.y);
    }
  };

  const mapSize = { width: 3500, height: 750 };
  const mapPoint = {
    x: 0,
    y: 0,
    dom: new PIXI.Text("", {
      fontFamily: "sans-serif",
      fill: 0xffffff,
    }),
  };
  mapPoint.dom.zIndex = 2;
  app.stage.addChild(mapPoint.dom);

  const scrollBarX = new PIXI.Graphics();
  scrollBarX.beginFill(0xff0000);
  scrollBarX.drawRect(
    0,
    0,
    (canvasSize.width * canvasSize.width) / mapSize.width,
    30,
  );
  scrollBarX.endFill();
  scrollBarX.position.set(0, canvasSize.height - 10);
  scrollBarX.zIndex = 2;
  app.stage.addChild(scrollBarX);

  const scrollBarY = new PIXI.Graphics();
  scrollBarY.beginFill(0xff0000);
  scrollBarY.drawRect(
    0,
    0,
    30,
    (canvasSize.height * canvasSize.height) / mapSize.height,
  );
  scrollBarY.endFill();
  scrollBarY.position.set(canvasSize.width - 10, 0);
  scrollBarY.zIndex = 2;
  app.stage.addChild(scrollBarY);

  const updateMapPoint = (x: number, y: number) => {
    mapPoint.x = Math.max(0, Math.min(mapSize.width - canvasSize.width, x));
    mapPoint.y = Math.max(0, Math.min(mapSize.height - canvasSize.height, y));
    mapPoint.dom.text = `X: ${x}, Y: ${y}`;

    scrollBarX.position.x = (mapPoint.x * canvasSize.width) / mapSize.width;
    scrollBarY.position.y = (mapPoint.y * canvasSize.height) / mapSize.height;

    reposition();
  };
  updateMapPoint(0, 0);

  for (let i = 0; i < 50; i++) {
    add({
      x: Math.random() * mapSize.width,
      y: Math.random() * mapSize.height,
      color: Math.random() * 0xffffff,
    });
  }

  app.stage.on("wheel", (event) => {
    updateMapPoint(mapPoint.x + event.deltaX, mapPoint.y + event.deltaY);
  });

  app.ticker.add(() => {
    sss.update();

    for (const key in keysPressed) {
      if (keysPressed[key]) {
        keysPressing[key] = (keysPressing[key] || 0) + 1;
      } else {
        keysPressing[key] = 0;
      }
    }
  });

  return app;
};

export default function Page() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sss.init();
    sss.setVolume(0.05);

    const app = main();
    ref.current?.replaceChildren(app.view as unknown as Node);

    const keydownhandler = (e: KeyboardEvent) => {
      e.preventDefault();
      keysPressed[e.code] = true;
    };
    const keyuphandler = (e: KeyboardEvent) => {
      e.preventDefault();
      keysPressed[e.code] = false;
    };

    window.addEventListener("keydown", keydownhandler);
    window.addEventListener("keyup", keyuphandler);

    return () => {
      app.destroy();
      window.removeEventListener("keydown", keydownhandler);
      window.removeEventListener("keyup", keyuphandler);
    };
  }, []);

  return <div ref={ref} />;
}
