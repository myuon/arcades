import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import { arrangeHorizontal, asContainer, centerize } from "../utils/container";

const keys: { [key: string]: boolean } = {};
const keysPressing: { [key: string]: number } = {};

const main = () => {
  const canvasSize = { width: 500, height: 500 };
  const app = new PIXI.Application({
    width: canvasSize.width,
    height: canvasSize.height,
  });
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  let mode: "start" | "play" | "gameover" = "start";

  let elapsed = 0.0;

  const gameStartLayer = asContainer(
    new PIXI.Text("Bullets", {
      fontFamily: "serif",
      fontSize: 64,
      fill: 0xffffff,
      stroke: 0x0044ff,
    }),
    new PIXI.Text("← STAGE 1 →", {
      fontFamily: "serif",
      fontSize: 24,
      fill: 0xffffff,
      stroke: 0x0044ff,
    }),
  );
  app.stage.addChild(gameStartLayer);

  arrangeHorizontal(gameStartLayer, { gap: 8, align: "center" });
  centerize(gameStartLayer, canvasSize);

  let stage = 0;

  const stages = [{}, {}, {}, {}, {}, {}];

  app.ticker.add((delta) => {
    sss.update();
    elapsed += delta;

    for (const key in keys) {
      keysPressing[key] = keys[key] ? (keysPressing[key] ?? 0) + 1 : 0;
    }

    if (mode === "start") {
      if (keysPressing.ArrowLeft === 1) {
        stage = (stage - 1 + stages.length) % stages.length;
        (gameStartLayer.children[1] as PIXI.Text).text = `← STAGE ${
          stage + 1
        } →`;
      } else if (keysPressing.ArrowRight === 1) {
        stage = (stage + 1) % stages.length;
        (gameStartLayer.children[1] as PIXI.Text).text = `← STAGE ${
          stage + 1
        } →`;
      }
      if (keys.ArrowEnter) {
        mode = "play";

        app.stage.removeChild(gameStartLayer);

        sss.playBgm("RAINS");
      }
    } else if (mode === "play") {
    } else if (mode === "gameover") {
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
      keys[e.key] = true;
    };
    const keyuphandler = (e: KeyboardEvent) => {
      e.preventDefault();
      keys[e.key] = false;
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
