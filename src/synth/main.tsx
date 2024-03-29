import { nanoid } from "nanoid";
import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import { asContainer } from "../utils/container";
import {
  createRectangleGraphics,
  drawRectangleGraphics,
} from "../utils/graphics";
import { withOnDrag } from "../utils/interact";

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

const keys = ["c", "c+", "d", "d+", "e", "f", "f+", "g", "g+", "a", "a+", "b"];

interface Note {
  id: string;
  key: string;
  pitch: number;
  length: number;
  start: number;
  dom: {
    container: PIXI.Container;
    base: PIXI.Graphics;
    handle: PIXI.Graphics;
  };
  inScreen: PIXI.Point;
  selected: boolean;
}

const main = () => {
  const canvasSize = { width: 960, height: 900 };
  const app = new PIXI.Application({
    width: canvasSize.width,
    height: canvasSize.height,
  });
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.sortableChildren = true;

  const gridSize = { x: 48, y: 16 };
  const findNote = (x: number, y: number) => {
    const ikey = Math.floor(y / gridSize.y);
    const key = keys[keys.length - 1 - (ikey % keys.length)];
    const pitch = 6 - Math.floor(ikey / keys.length);

    return {
      key,
      pitch,
      start: Math.floor(x / gridSize.x) - 1,
    };
  };

  let notes: Note[] = [];

  const addNote = (note: Partial<Note>) => {
    if (!note.start) {
      note.start = 0;
    }
    if (!note.pitch) {
      note.pitch = 3;
    }
    if (!note.id) {
      note.id = nanoid();
    }
    if (!note.inScreen) {
      note.inScreen = new PIXI.Point(0, 0);
    }
    if (!note.length) {
      note.length = 1;
    }
    if (!note.selected) {
      note.selected = false;
    }

    if (!note.dom) {
      const graphics = new PIXI.Graphics();

      graphics.eventMode = "static";
      graphics.cursor = "pointer";
      note.inScreen.x = (note.start + 1) * gridSize.x;

      graphics.on(
        "pointerup",
        function (this: string, event: PIXI.FederatedPointerEvent) {
          if (event.button === 2) {
            deleteNote(this);
          }
        },
        note.id,
      );
      graphics.on("pointerdown", () => {
        note.selected = !(note.selected ?? false);

        renderNote(note as Note);
      });

      // find Y
      let y = 0;
      while (
        findNote(0, y).key !== note.key ||
        findNote(0, y).pitch !== note.pitch
      ) {
        y += gridSize.y;
      }
      note.inScreen.y = y;

      const handle = new PIXI.Graphics();
      handle.eventMode = "static";
      handle.cursor = "ew-resize";

      const container = asContainer(graphics, handle);
      withOnDrag(
        graphics,
        app.stage,
        (event: PIXI.FederatedPointerEvent) => {
          graphics.alpha = 0.5;
          container.position.set(
            Math.floor(event.global.x / gridSize.x) * gridSize.x,
            Math.floor(event.global.y / gridSize.y) * gridSize.y,
          );
        },
        () => {
          graphics.alpha = 1;

          const i = findNote(container.position.x, container.position.y);
          updateNote(note.id, {
            key: i.key,
            pitch: i.pitch,
            start: i.start,
          });
        },
      );

      withOnDrag(handle, app.stage, (event: PIXI.FederatedPointerEvent) => {
        const length = Math.max(
          Math.round((event.global.x - container.x) / gridSize.x),
          1,
        );

        handle.position.set(container.width - 8, 0);
        graphics.width = length * gridSize.x;
        container.width = length * gridSize.x;

        updateNote(note.id, {
          length,
        });
      });

      container.zIndex = 1;
      note.dom = {
        container,
        base: graphics,
        handle,
      };
      note.dom.container.position.set(note.start * 24, note.pitch * 24);

      app.stage.addChild(note.dom.container);
    }

    renderNote(note as Note);

    notes.push(note as Note);
  };
  const updateNote = (id: string | undefined, value: Partial<Note>) => {
    const i = notes.findIndex((note) => note.id === id);
    if (i !== -1) {
      notes[i] = { ...notes[i], ...value };
    }
  };
  const deleteNote = (id: string) => {
    const i = notes.findIndex((note) => note.id === id);
    if (i !== -1) {
      app.stage.removeChild(notes[i].dom.container as PIXI.Graphics);
      notes = notes.filter((note) => note.id !== id);
    }
  };
  const renderNote = (note: Note) => {
    note.dom.base.clear();
    if (note.selected) {
      note.dom.base.lineStyle(2, 0xffffff, 1);
    }
    drawRectangleGraphics(
      note.dom.base,
      gridSize.x * (note.length ?? 1),
      gridSize.y,
      0xff0000,
    );

    drawRectangleGraphics(note.dom.handle, 8, gridSize.y, 0x993333);
    note.dom.handle.position.set(note.dom.base.width - 8, 0);
  };

  const renderMML = () => {
    let length = 0;
    for (const note of notes) {
      length = Math.max(length, note.start + note.length);
    }

    length += 4;

    const tracks: {
      id: string;
      key: string;
      pitch: number;
    }[][] = Array.from({ length }).map(() => []);

    for (const note of notes) {
      for (let i = note.start; i < note.start + note.length; i++) {
        tracks[i].push({ id: note.id, key: note.key, pitch: note.pitch });
      }
    }

    let trackNum = 0;
    const mmls = [];

    while (trackNum < 20) {
      const words = ["@synth o4"];
      let pitch = 4;
      let i = 0;
      while (i < length) {
        const isRest = tracks[i].length === 0;
        if (isRest) {
          words.push("r4");
          i++;
          continue;
        }

        const note = tracks[i][0];
        if (note.pitch !== pitch) {
          words.push(`o${note.pitch}`);

          pitch = note.pitch;
        }

        let l = 0;
        while (i < length && tracks[i]?.[0]?.id === note.id) {
          tracks[i].shift();
          i++;
          l++;
        }

        words.push(`${note.key}${4 / l}`);
      }

      mmls.push(words.join(" "));

      trackNum++;

      if (tracks.every((track) => track.length === 0)) {
        break;
      }
    }

    return mmls;
  };

  const screen = {
    width: 3500,
    height: 900,
    screenPointRaw: new PIXI.Point(0, 0),
    screenPoint: new PIXI.Point(0, 0),
    headers: [] as {
      inScreen: PIXI.Point;
      dom: PIXI.Container;
    }[],
    dom: {
      scrollBarX: new PIXI.Graphics(),
      scrollBarY: new PIXI.Graphics(),
    },
  };
  const initScreen = () => {
    const scrollBarX = screen.dom.scrollBarX;
    scrollBarX.beginFill(0xff0000);
    scrollBarX.drawRect(
      0,
      0,
      (canvasSize.width * canvasSize.width) / screen.width,
      10,
    );
    scrollBarX.endFill();
    scrollBarX.position.set(0, canvasSize.height - 10);
    scrollBarX.zIndex = 2;
    app.stage.addChild(scrollBarX);

    const scrollBarY = screen.dom.scrollBarY;
    scrollBarY.beginFill(0xff0000);
    scrollBarY.drawRect(
      0,
      0,
      10,
      (canvasSize.height * canvasSize.height) / screen.height,
    );
    scrollBarY.endFill();
    scrollBarY.position.set(canvasSize.width - 10, 0);
    scrollBarY.zIndex = 2;
    app.stage.addChild(scrollBarY);

    for (let i = 0; i < screen.height; i += gridSize.y) {
      const container = new PIXI.Container();

      const note = findNote(0, i);
      const isBlack = note.key.includes("+");

      if (!isBlack) {
        const background = createRectangleGraphics(
          gridSize.x,
          gridSize.y,
          0xffffff,
        );

        container.addChild(background);
      }

      const text = new PIXI.Text(`${note.key.toUpperCase()}${note.pitch}`, {
        fontSize: 14,
        fill: isBlack ? 0xffffff : 0x333333,
      });
      text.position.set(12, 0);
      container.addChild(text);
      container.zIndex = 3;

      screen.headers.push({ inScreen: new PIXI.Point(0, i), dom: container });

      app.stage.addChild(container);
    }
    for (let i = 0; i < screen.height; i += gridSize.y) {
      const line = createRectangleGraphics(1024, 1, 0x666666);
      line.position.set(0, i);

      app.stage.addChild(line);
    }
    for (let i = 0; i < screen.width; i += gridSize.x) {
      const line = createRectangleGraphics(1, 1024, 0xffffff);
      line.position.set(i, 0);

      app.stage.addChild(line);
    }
  };

  const reposition = () => {
    for (const r of notes) {
      r.dom.container.position.set(
        r.inScreen.x - screen.screenPoint.x,
        r.inScreen.y - screen.screenPoint.y,
      );
    }

    for (const r of screen.headers) {
      r.dom.position.set(0, r.inScreen.y - screen.screenPoint.y);
    }
  };

  try {
    const ns: Note[] = JSON.parse(localStorage.getItem("synth") ?? "");
    for (const note of ns) {
      addNote(note);
    }
  } catch (err) {
    addNote({
      key: "c",
      pitch: 4,
      length: 1,
      start: 0,
    });
    addNote({
      key: "d",
      pitch: 3,
      length: 1,
      start: 1,
    });
  }

  app.stage.on("pointerdown", (event) => {
    for (const note of notes) {
      if (note.dom.base.containsPoint(event.global)) {
        return;
      }
    }

    if (event.global.x < gridSize.x) {
      return;
    }

    const inScreen = new PIXI.Point(
      event.global.x + screen.screenPoint.x,
      event.global.y + screen.screenPoint.y,
    );
    const n = findNote(inScreen.x, inScreen.y);

    addNote({
      key: n.key,
      pitch: n.pitch,
      length: 1,
      start: n.start,
    });
    reposition();
  });

  initScreen();

  const updateMapPoint = (x: number, y: number) => {
    screen.screenPointRaw.x = Math.max(
      0,
      Math.min(screen.width - canvasSize.width, x),
    );
    screen.screenPointRaw.y = Math.max(
      0,
      Math.min(screen.height - canvasSize.height, y),
    );

    screen.screenPoint.x =
      Math.floor(screen.screenPointRaw.x / gridSize.x) * gridSize.x;
    screen.screenPoint.y =
      Math.floor(screen.screenPointRaw.y / gridSize.y) * gridSize.y;

    screen.dom.scrollBarX.position.x =
      (screen.screenPoint.x * canvasSize.width) / screen.width;
    screen.dom.scrollBarY.position.y =
      (screen.screenPoint.y * canvasSize.height) / screen.height;

    reposition();
  };

  updateMapPoint(0, 0);

  app.stage.on("wheel", (event) => {
    updateMapPoint(
      screen.screenPointRaw.x + event.deltaX,
      screen.screenPointRaw.y + event.deltaY,
    );
  });

  const playing = {
    isPlaying: false,
    bpm: 166,
    x: 0,
    dom: new PIXI.Graphics(),
  };
  playing.dom.beginFill(0x00ff00);
  playing.dom.drawRect(gridSize.x, 0, 1, canvasSize.height);
  playing.dom.endFill();
  app.stage.addChild(playing.dom);

  const bpmCoeff = 1.66;
  const startPlaying = () => {
    playing.isPlaying = true;
    playing.x = 0;
  };
  const updatePlaying = (delta: number) => {
    if (playing.isPlaying) {
      playing.x += gridSize.x / (30 / ((bpmCoeff * playing.bpm) / 100) / delta);

      playing.dom.position.x = playing.x - screen.screenPoint.x;
    }
  };

  app.ticker.add((delta) => {
    sss.update();
    updatePlaying(delta);

    for (const key in keysPressed) {
      if (keysPressed[key]) {
        keysPressing[key] = (keysPressing[key] || 0) + 1;
      } else {
        keysPressing[key] = 0;
      }
    }

    if (keysPressing.Space === 1) {
      const mmls = renderMML();
      console.log(mmls);

      sss.playMml(mmls, {
        isLooping: false,
        speed: (bpmCoeff * playing.bpm) / 100,
      });
      startPlaying();
    }
    if (keysPressing.ControlLeft > 0 && keysPressing.KeyS === 1) {
      localStorage.setItem(
        "synth",
        JSON.stringify(
          notes.map((note) => ({
            key: note.key,
            pitch: note.pitch,
            length: note.length,
            start: note.start,
          })),
        ),
      );

      console.log("saved");
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
    const contextmenuhandler = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", keydownhandler);
    window.addEventListener("keyup", keyuphandler);
    ref.current?.addEventListener("contextmenu", contextmenuhandler);

    return () => {
      app.destroy();
      ref.current?.removeEventListener("contextmenu", contextmenuhandler);
      window.removeEventListener("keydown", keydownhandler);
      window.removeEventListener("keyup", keyuphandler);
    };
  }, []);

  return <div ref={ref} />;
}
