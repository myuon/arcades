import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import { arrangeVertical, asContainer, centerize } from "../utils/container";
import {
  Game,
  GamePlugin,
  pluginAppealEffect,
  pluginKeydown,
  pluginKeydownOptions,
  pluginMoveByArrowKeys,
} from "../utils/game";
import { createGraphics } from "../utils/graphics";
import { normalize, scale } from "../utils/vector";

const createGameStart = (game: Game) => {
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
  arrangeVertical(gameStartLayer, { gap: 8, align: "center" });
  centerize(gameStartLayer, game.canvasSize);

  const gameStartLayerEntity = Game.entity({
    graphics: gameStartLayer,
    position: {
      centerX: true,
      centerY: true,
    },
    plugins: [
      pluginKeydown(
        pluginKeydownOptions([
          {
            key: "ArrowLeft",
            onKeydown() {
              stage = (stage - 1 + stages.length) % stages.length;
              (gameStartLayer.children[1] as PIXI.Text).text = `← STAGE ${
                stage + 1
              } →`;
            },
          },
          {
            key: "ArrowRight",
            onKeydown() {
              stage = (stage + 1) % stages.length;
              (gameStartLayer.children[1] as PIXI.Text).text = `← STAGE ${
                stage + 1
              } →`;
            },
          },
          {
            key: " ",
            onKeydown() {
              mode = "play";

              sss.playBgm(`BULLETS ${stage + 1}`);
            },
          },
        ]),
      ),
    ],
  });

  return gameStartLayerEntity;
};
const createGameOver = (game: Game) => {
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
  arrangeVertical(gameOverLayer, { gap: 8, align: "center" });
  centerize(gameOverLayer, game.canvasSize);

  const entity = Game.entity({
    graphics: gameOverLayer,
    position: {
      centerX: true,
      centerY: true,
    },
    plugins: [
      pluginKeydown(
        pluginKeydownOptions([
          {
            key: "Enter",
            onKeydown() {
              mode = "start";

              Game.init(game);
            },
          },
        ]),
      ),
    ],
  });

  return entity;
};

const createPlayer = (game: Game) => {
  const character = createGraphics(["l"], undefined, 20);

  const entity = Game.entity({
    alias: "player",
    graphics: character,
    position: {
      bottom: 20,
      centerX: true,
    },
    plugins: [
      pluginMoveByArrowKeys({
        speed: 3,
        clampedBy: game.canvasSize,
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

  return entity;
};
const createEnemy = (_game: Game) => {
  const enemy = createGraphics(["l"], 0xff0000);

  const entity = Game.entity({
    alias: "enemy",
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
    ],
  });

  return entity;
};

const gamePlugin = (): GamePlugin => {
  let frame = 0;
  const bullet = createGraphics(
    [" lll ", "lllll", "lllll", " lll "],
    0xffffff,
    8,
  );
  const bullets: { graphics: PIXI.Graphics; velocity: PIXI.Point }[] = [];

  return {
    name: "game",
    onRender: (game: Game) => {
      const updateBullets = () => {
        for (const b of bullets) {
          b.graphics.x += b.velocity.x;
          b.graphics.y += b.velocity.y;

          if (!game.app.screen.contains(b.graphics.x, b.graphics.y)) {
            game.app.stage.removeChild(b.graphics);
          }
        }
      };

      frame += 1;

      if (mode === "play") {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        const player = Game.getEntityByAlias(game, "player")!;
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        const enemy = Game.getEntityByAlias(game, "enemy")!;

        if (frame % 20 === 0) {
          for (let i = 0; i < 360; i += 360 / 20) {
            const b = bullet.clone();
            b.x =
              enemy.graphics.x +
              (enemy.graphics as PIXI.Graphics).width / 2 -
              b.width / 2;
            b.y =
              enemy.graphics.y +
              (enemy.graphics as PIXI.Graphics).height / 2 -
              b.height / 2;

            const angle = Math.atan2(
              player.graphics.y - b.y,
              player.graphics.x - b.x,
            );

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
            game.app.stage.addChild(b);
          }
        }

        updateBullets();

        for (const b of bullets) {
          if (
            (player.graphics.x - b.graphics.x) ** 2 +
              (player.graphics.y - b.graphics.y) ** 2 <
            (10 + 4) ** 2
          ) {
            mode = "gameover";
            sss.stopBgm();
            sss.playSoundEffect("explosion");
          }
        }
      } else if (mode === "start") {
        if (bullets.length > 0) {
          for (const b of bullets) {
            game.app.stage.removeChild(b.graphics);
          }

          bullets.length = 0;
        }
      }
    },
  };
};

let mode: "start" | "play" | "gameover" = "start";
const stages = [{}, {}, {}, {}, {}, {}];
let stage = 0;

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

  const game: Game = {
    keys,
    keysPressing,
    app,
    canvasSize,
    entities: [],
    eventQueue: [],
    plugins: [gamePlugin()],
  };

  const gameStartLayer = createGameStart(game);
  const gameOverLayer = createGameOver(game);
  const player = createPlayer(game);
  const enemy = createEnemy(game);

  app.ticker.add(() => {
    sss.update();

    for (const key in keys) {
      keysPressing[key] = keys[key] ? (keysPressing[key] ?? 0) + 1 : 0;
    }

    Game.render(game);

    if (mode === "start") {
      Game.declare(game, [gameStartLayer]);
    } else if (mode === "play") {
      Game.declare(game, [player, enemy]);
    } else if (mode === "gameover") {
      Game.declare(game, [player, enemy, gameOverLayer]);
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
