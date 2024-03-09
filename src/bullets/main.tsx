import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import { arrangeHorizontal, asContainer, centerize } from "../utils/container";
import {
  Entity,
  Game,
  pluginAppealEffect,
  pluginMoveByArrowKeys,
} from "../utils/game";
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

  const gameOverLayer = asContainer(
    new PIXI.Text("GAME OVER", {
      fontFamily: "serif",
      fontSize: 64,
      fill: 0xffffff,
      stroke: 0x0044ff,
    }),
    new PIXI.Text("PRESS ENTER TO RESTART", {
      fontFamily: "serif",
      fontSize: 24,
      fill: 0xffffff,
      stroke: 0x0044ff,
    }),
  );
  arrangeHorizontal(gameOverLayer, { gap: 8, align: "center" });
  centerize(gameOverLayer, canvasSize);

  let stage = 0;

  const stages = [{}, {}, {}, {}, {}, {}];

  const character = createGraphics(["l"], undefined, 20);
  const enemy = createGraphics(["l"], 0xff0000);
  const bullet = createGraphics(
    [" lll ", "lllll", "lllll", " lll "],
    0xffffff,
    8,
  );

  const pluginEnemy = () => {
    let frame = 0;

    return {
      name: "enemy",
      onRender: (_game: Game, _entity: Entity) => {
        if (mode === "play") {
          frame += 1;

          if (frame % 20 === 0) {
            for (let i = 0; i < 360; i += 360 / 20) {
              const b = bullet.clone();
              b.x = enemy.x + enemy.width / 2 - b.width / 2;
              b.y = enemy.y + enemy.height / 2 - b.height / 2;

              const angle = Math.atan2(character.y - b.y, character.x - b.x);

              bullets.push({
                graphics: b,
                velocity: scale(
                  normalize(
                    new PIXI.Point(
                      Math.cos(angle + (i * Math.PI) / 180),
                      Math.sin(angle + (i * Math.PI) / 180),
                    ),
                  ),
                  4.5,
                ),
              });
              app.stage.addChild(b);
            }
          }
        }
      },
    };
  };

  const game: Game = {
    keys,
    app,
    canvasSize,
    entities: [],
    eventQueue: [],
  };

  Game.register(game, {
    graphics: character,
    position: {
      bottom: 20,
      centerX: true,
    },
    plugins: [
      pluginMoveByArrowKeys({
        speed: 3,
        clampedBy: canvasSize,
        condition: () => mode === "play",
      }),
      pluginAppealEffect({
        from: {
          bottom: -20,
          centerX: true,
        },
        start: () => mode === "play",
      }),
    ],
  });

  Game.register(game, {
    graphics: enemy,
    position: {
      top: 20,
      centerX: true,
    },
    plugins: [
      pluginAppealEffect({
        from: {
          top: -40,
          centerX: true,
        },
        start: () => mode === "play",
      }),
      pluginEnemy(),
    ],
  });

  Game.render(game);

  let bullets: { graphics: PIXI.Graphics; velocity: PIXI.Point }[] = [];
  const updateBullets = () => {
    for (const b of bullets) {
      b.graphics.x += b.velocity.x;
      b.graphics.y += b.velocity.y;

      if (!app.screen.contains(b.graphics.x, b.graphics.y)) {
        app.stage.removeChild(b.graphics);
      }
    }
  };

  const initPlay = () => {
    mode = "play";

    app.stage.removeChild(gameStartLayer);

    sss.playBgm(`BULLETS ${stage + 1}`);
  };

  app.ticker.add(() => {
    sss.update();

    for (const key in keys) {
      keysPressing[key] = keys[key] ? (keysPressing[key] ?? 0) + 1 : 0;
    }

    Game.render(game);

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
        initPlay();
      }
    } else if (mode === "play") {
      updateBullets();

      for (const b of bullets) {
        if (
          (character.x - b.graphics.x) ** 2 +
            (character.y - b.graphics.y) ** 2 <
          (10 + 4) ** 2
        ) {
          mode = "gameover";
          sss.stopBgm();
          sss.playSoundEffect("explosion");

          app.stage.addChild(gameOverLayer);
        }
      }
    } else if (mode === "gameover") {
      if (keys.Enter) {
        mode = "start";

        app.stage.removeChild(gameOverLayer);

        character.x = 250 - character.width / 2;
        for (const b of bullets) {
          app.stage.removeChild(b.graphics);
        }
        bullets = [];

        app.stage.addChild(gameStartLayer);
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
