import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import {
  createRectangleGraphics,
  drawRectangleGraphics,
} from "../utils/graphics";

const keysPressed: { [key: string]: boolean } = {};
const keysPressing: { [key: string]: number } = {};

// const mml = [
// Specify the tone as `@synth`.
// `@s308454596`sets the random number seed to generate the tone.
// "@synth o4 d+4 >c+4 <c+16 r16 c+16",
// "@synth@s308454596 v50 l16 o4 r4b4 >c+erer8.<b b2 >c+2 <b2 >c+ec+<ar>c+r<a f+g+af+rf+er e2",
// "@synth@s771118616 v35 l4 o4 f+f+ f+1 >c+ <g+ f+f+ eg+ ab b2",
// "@synth@s848125671 v40 l4 o4 d+16d+16f+16e16e16e16e16<b16 >ee b8.b16r8>f+8 c+c+ <b>f+ <aa a2 bb",
// Set the drum part with '@d'.
// "@explosion@d@s364411560 v40 l16 o4 cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8. cr8.cr8.",
// "@explosion@d@s152275772 v40 l16 o4 r8crcrcr8. cccrcr8. crcrcr8. crcrcr8. crcrcr8. crcrcr8. crcrcr8. crcrcr",
// "@hit@d@s234851483 v50 l16 o4 rcr4^16c rcr4. ccr4^16c rcr4.^16 cr4^16c rcr4.^16 cr4^16c rcr4.",
// ];

const keys = "cdefgab".split("");

interface Note {
  key: string;
  pitch: number;
  length: number;
  start: number;
  dom?: PIXI.Graphics;
}

const main = () => {
  const canvasSize = { width: 1024, height: 500 };
  const app = new PIXI.Application({
    width: canvasSize.width,
    height: canvasSize.height,
  });
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const gridSize = { x: 64, y: 24 };
  const findNote = (x: number, y: number) => {
    const ikey = Math.floor(y / gridSize.y);
    const key = keys[keys.length - 1 - (ikey % keys.length)];
    const pitch = 5 - Math.floor(ikey / keys.length);

    return {
      key,
      pitch,
      start: Math.floor(x / gridSize.x) - 1,
    };
  };

  const notes: Note[] = [
    {
      key: "c",
      pitch: 4,
      length: 1,
      start: 0,
    },
    {
      key: "d",
      pitch: 3,
      length: 1,
      start: 1,
    },
  ];
  const renderNotes = () => {
    for (const note of notes) {
      if (!note.dom) {
        note.dom = createRectangleGraphics(gridSize.x, gridSize.y, 0xff0000);
        note.dom.eventMode = "static";
        note.dom.cursor = "pointer";
        note.dom.position.set(note.start * 24, note.pitch * 24);
        note.dom.x = (note.start + 1) * gridSize.x;

        // find Y
        let y = 0;
        while (
          findNote(0, y).key !== note.key ||
          findNote(0, y).pitch !== note.pitch
        ) {
          y += gridSize.y;
        }

        note.dom.y = y;

        app.stage.addChild(note.dom);
      }
    }
  };
  const renderMML = () => {
    let length = 0;
    for (const note of notes) {
      length = Math.max(length, note.start + note.length);
    }

    length += 4;

    const tracks = [Array.from({ length }).map(() => "r4")];

    for (const note of notes) {
      for (let i = note.start; i < note.start + note.length; i++) {
        tracks[0][i] = `${note.key}4`;
      }
    }

    return `@synth o4 ${tracks[0].join(" ")}`;
  };

  // grid
  for (let i = 0; i < canvasSize.height; i += gridSize.y) {
    const line = createRectangleGraphics(1024, 1, 0x666666);
    line.position.set(0, i);

    const note = findNote(0, i);
    const text = new PIXI.Text(`${note.key}${note.pitch}`, {
      fontSize: 18,
      fill: 0xffffff,
    });
    text.position.set(12, i);

    app.stage.addChild(line);
    app.stage.addChild(text);
  }
  for (let i = 0; i < canvasSize.width; i += gridSize.x) {
    const line = createRectangleGraphics(1, 1024, 0xffffff);
    line.position.set(i, 0);

    app.stage.addChild(line);
  }

  renderNotes();

  app.stage.on("pointerdown", (event) => {
    for (const note of notes) {
      if (note.dom?.containsPoint(event.global)) {
        note.dom.clear();
        drawRectangleGraphics(note.dom, gridSize.x, gridSize.y, 0x00ff00);

        return;
      }
    }

    if (event.global.x < gridSize.x) {
      return;
    }
    const key =
      keys[
        keys.length -
          1 -
          (Math.floor(event.global.y / gridSize.y) % keys.length)
      ];
    const pitch = 5 - Math.floor(event.global.y / gridSize.y / keys.length);

    notes.push({
      key,
      pitch,
      length: 1,
      start: Math.floor(event.global.x / gridSize.x) - 1,
    });

    renderNotes();
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

    if (keysPressing[" "] === 1) {
      const mml = renderMML();
      console.log(mml);

      sss.playMml([mml], {
        isLooping: false,
      });
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
      keysPressed[e.key] = true;
    };
    const keyuphandler = (e: KeyboardEvent) => {
      e.preventDefault();
      keysPressed[e.key] = false;
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
