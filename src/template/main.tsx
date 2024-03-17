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
