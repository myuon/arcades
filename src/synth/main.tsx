import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import {
  arrangeHorizontal,
  arrangeVertical,
  asContainer,
} from "../utils/container";
import { Game, GamePlugin, pluginEntityClick } from "../utils/game";
import { createRectangleGraphics } from "../utils/graphics";

let mml = [
  // Specify the tone as `@synth`.
  // `@s308454596`sets the random number seed to generate the tone.
  "@synth o4 d+4 >c+4 <c+16 r16 c+16",
  // "@synth@s308454596 v50 l16 o4 r4b4 >c+erer8.<b b2 >c+2 <b2 >c+ec+<ar>c+r<a f+g+af+rf+er e2",
  // "@synth@s771118616 v35 l4 o4 f+f+ f+1 >c+ <g+ f+f+ eg+ ab b2",
  // "@synth@s848125671 v40 l4 o4 d+16d+16f+16e16e16e16e16<b16 >ee b8.b16r8>f+8 c+c+ <b>f+ <aa a2 bb",
  // Set the drum part with '@d'.
  // "@explosion@d@s364411560 v40 l16 o4 cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8.",
  // "@explosion@d@s152275772 v40 l16 o4 r8crcrcr8. cccrcr8. crcrcr8. crcrcr8. crcrcr8. crcrcr8. crcrcr8. crcrcr",
  // "@hit@d@s234851483 v50 l16 o4 rcr4^16c rcr4. ccr4^16c rcr4.^16 cr4^16c rcr4.^16 cr4^16c rcr4.",
];

const createButton = (options: {
  color: number;
  onClick: () => void;
}) => {
  const button = createRectangleGraphics(100, 50, options.color);

  const entity = Game.entity({
    graphics: button,
    position: { centerY: true },
    plugins: [
      pluginEntityClick({
        onClick: options.onClick,
      }),
    ],
  });

  return entity;
};

const noteTypes = ["c", "d", "e", "f", "g", "a", "b"];
const createNote = (note: string, length: string) => {
  return {
    graphics: createRectangleGraphics(20, 10, 0x00ff00),
    note,
    length,
  };
};

const pluginGame = (): GamePlugin => {
  let dirty = true;
  const notes = [createNote("c", "16")];

  const container = asContainer(
    ...notes.map((n) => {
      return n.graphics;
    }),
  );
  container.y = 100;
  arrangeHorizontal(container, { align: "center", gap: 2 });

  mml = [`@synth o4 ${notes.map((n) => `${n.note}${n.length}`).join(" ")} r4`];

  const text = asContainer(
    new PIXI.Text("MML", {
      fill: 0xffffff,
      fontSize: 18,
    }),
    ...mml.map(
      (m) =>
        new PIXI.Text(m, {
          fill: 0xffffff,
          fontSize: 16,
        }),
    ),
  );
  arrangeVertical(text, { align: "left", gap: 8 });

  const playButton = createButton({
    color: 0x00ff00,
    onClick: () => {
      sss.playMml(mml, {
        isLooping: false,
      });
    },
  });
  const addButton = createButton({
    color: 0x0000ff,
    onClick: () => {
      notes.push(createNote("c", "16"));
      dirty = true;
    },
  });
  playButton.graphics.x = 300;
  addButton.graphics.x = 500;

  return {
    name: "game",
    onInit: (game: Game) => {
      game.app.stage.addChild(container);
      game.app.stage.addChild(text);
      Game.register(game, playButton);
      Game.register(game, addButton);
    },
    onRender: () => {
      if (dirty) {
        mml = [
          `@synth o4 ${notes.map((n) => `${n.note}${n.length}`).join(" ")} r4`,
        ];

        (text.children[1] as PIXI.Text).text = mml[0];
        arrangeVertical(text, { align: "left", gap: 8 });
      }

      dirty = false;
    },
  };
};

const main = () => {
  const canvasSize = { width: 1024, height: 500 };
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
    plugins: [pluginGame()],
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
