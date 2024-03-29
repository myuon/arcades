import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import { Game, GamePlugin } from "../utils/game";
import { GSX } from "../utils/gsx";

const gamePlugin = (): GamePlugin => {
  const renderer = new GSX.Renderer();
  let size = 16;
  let gap = 0;
  const children = [
    GSX.text({ fontSize: size, text: "Hello, World" }),
    GSX.text({ fontSize: size, text: "Next line" }),
  ];

  return {
    name: "game",
    onInit: (game) => {
      game.app.stage.addChild(renderer.container);

      game.app.stage.on("click", () => {
        size += 2;
        gap += 2;
        children.push(GSX.text({ fontSize: size, text: "New line" }));

        renderer.rerender = true;
      });
    },
    onRender: (game) => {
      renderer.render(
        GSX.container({
          layout: {
            type: "column",
            gap: gap,
          },
          children,
        }),
      );
    },
  };
};

const main = () => {
  const canvasSize = { width: 500, height: 500 };
  const app = new PIXI.Application({
    width: canvasSize.width,
    height: canvasSize.height,
  });
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const game: Game = {
    keys: {},
    keysPressing: {},
    app,
    canvasSize,
    entities: [],
    eventQueue: [],
    plugins: [gamePlugin()],
  };

  Game.init(game);

  app.ticker.add(() => {
    sss.update();

    Game.render(game);
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

    return () => {
      app.destroy();
    };
  }, []);

  return <div ref={ref} />;
}
