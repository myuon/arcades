import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import {
  arrangeHorizontal,
  asContainer,
  centerize,
  position,
} from "../utils/container";
import { createGraphics } from "../utils/graphics";
import { normalize, scale } from "../utils/vector";

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
    new PIXI.Text("Press SPACE to Start", {
      fontFamily: "serif",
      fontSize: 28,
      fill: 0xffffff,
      stroke: 0x0044ff,
    }),
  );
  app.stage.addChild(gameStartLayer);

  arrangeHorizontal(gameStartLayer, { gap: 8, align: "center" });
  centerize(gameStartLayer, canvasSize);

  let stage = 0;

  const stages = [{}, {}, {}, {}, {}, {}];

  const character = createGraphics(["l"]);
  const enemy = createGraphics(["l"], 0xff0000);
  const bullet = createGraphics(
    [" lll ", "lllll", "lllll", " lll "],
    0xffffff,
    8,
  );

  let frames = 0;

  const bullets: { graphics: PIXI.Graphics; velocity: PIXI.Point }[] = [];
  const updateBullets = () => {
    for (const b of bullets) {
      b.graphics.x += b.velocity.x;
      b.graphics.y += b.velocity.y;
    }
  };

  app.ticker.add((delta) => {
    sss.update();
    elapsed += delta;
    frames += 1;

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
      if (keys[" "]) {
        mode = "play";

        app.stage.removeChild(gameStartLayer);

        sss.playBgm(`BULLETS ${stage + 1}`);

        app.stage.addChild(character);
        position(character, canvasSize, { bottom: 20, centerX: true });

        app.stage.addChild(enemy);
        position(enemy, canvasSize, { top: 20, centerX: true });
      }
    } else if (mode === "play") {
      if (keys.ArrowLeft) {
        character.x -= 3;
      }
      if (keys.ArrowRight) {
        character.x += 3;
      }
      if (keys.ArrowUp) {
        character.y -= 3;
      }
      if (keys.ArrowDown) {
        character.y += 3;
      }

      character.x = Math.max(0, Math.min(500 - character.width, character.x));
      character.y = Math.max(0, Math.min(500 - character.height, character.y));

      if (frames % 30 === 0) {
        const b = bullet.clone();
        b.x = enemy.x + enemy.width / 2 - b.width / 2;
        b.y = enemy.y + enemy.height / 2 - b.height / 2;

        bullets.push({
          graphics: b,
          velocity: scale(
            normalize(
              new PIXI.Point(character.x - enemy.x, character.y - enemy.y),
            ),
            3,
          ),
        });
        app.stage.addChild(b);
      }

      updateBullets();
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
