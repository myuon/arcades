import * as PIXI from "pixi.js";
import * as sss from "sounds-some-sounds";
import chroma from "chroma-js";

const intersect = (a: PIXI.Rectangle, b: PIXI.Rectangle) => {
  return (
    a.x + a.width > b.x &&
    a.x < b.x + b.width &&
    a.y + a.height > b.y &&
    a.y < b.y + b.height
  );
};

const main = () => {
  const app = new PIXI.Application({ width: 500, height: 500 });
  document.body.appendChild(app.view as unknown as Node);

  const block = new PIXI.Graphics();
  block.beginFill(0x0000ff);
  block.drawRect(0, 0, 100, 100);
  block.endFill();

  const bar = new PIXI.Graphics();
  bar.beginFill(0x00ff00);
  bar.drawRect(0, 0, 100, 10);
  bar.endFill();
  bar.x = 250 - bar.width / 2;
  bar.y = 500 - 100;

  app.stage.addChild(bar);

  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  const stagePadding = { x: 20, y: 20 };
  const blockNum = { x: 5, y: 5 };
  const blockGap = { x: 5, y: 5 };

  const blocks: PIXI.Graphics[] = [];

  const initializeBlocks = () => {
    for (let j = 0; j < blockNum.y; j++) {
      for (let i = 0; i < blockNum.x; i++) {
        const block = new PIXI.Graphics();
        block.beginFill(
          chroma.scale(["#00ffff", "#ff00ff"]).mode("lab").colors(blockNum.y)[j]
        );
        block.drawRect(
          0,
          0,
          (app.screen.width -
            stagePadding.x * 2 -
            blockGap.x * (blockNum.x - 1)) /
            blockNum.x,
          20
        );
        block.endFill();
        block.x = i * (block.width + blockGap.x) + stagePadding.x;
        block.y = j * (block.height + blockGap.y) + stagePadding.y;

        blocks.push(block);
        app.stage.addChild(block);
      }
    }
  };

  initializeBlocks();

  const ball = new PIXI.Graphics();
  ball.beginFill(0xffff00);
  ball.drawCircle(0, 0, 7);
  ball.endFill();
  ball.x = 250;
  ball.y = bar.y - 25;
  app.stage.addChild(ball);

  const ballVelocityInitial = {
    x: 6 * Math.cos(-Math.PI / 4),
    y: 6 * Math.sin(-Math.PI / 4),
  };
  let ballVelocity = { ...ballVelocityInitial };

  let mode = "start";

  let elapsed = 0.0;

  const startScreenTextH1 = new PIXI.Text("BREAKOUT", {
    fontFamily: "serif",
    fontSize: 64,
    fill: 0xffffff,
    stroke: 0x0044ff,
  });
  startScreenTextH1.x = 250 - startScreenTextH1.width / 2;
  startScreenTextH1.y = 250 - startScreenTextH1.height / 2;
  app.stage.addChild(startScreenTextH1);

  const startScreenTextH2 = new PIXI.Text("CLICK TO START", {
    fontFamily: "serif",
    fontSize: 24,
    fill: 0xffffff,
    stroke: 0x0044ff,
  });
  startScreenTextH2.x = 250 - startScreenTextH2.width / 2;
  startScreenTextH2.y = 250 + startScreenTextH1.height / 2;
  app.stage.addChild(startScreenTextH2);

  const gameoverTextH1 = new PIXI.Text("GAME OVER", {
    fontFamily: "serif",
    fontSize: 64,
    fill: 0xffffff,
    stroke: 0x0044ff,
  });
  gameoverTextH1.x = 250 - gameoverTextH1.width / 2;
  gameoverTextH1.y = 250 - gameoverTextH1.height / 2;

  const gameclearTextH1 = new PIXI.Text("GAME CLEAR", {
    fontFamily: "serif",
    fontSize: 64,
    fill: 0xffffff,
    stroke: 0x0044ff,
  });
  gameclearTextH1.x = 250 - gameclearTextH1.width / 2;
  gameclearTextH1.y = 250 - gameclearTextH1.height / 2;

  app.stage.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
    bar.x = e.x - bar.width / 2;

    if (!mode) {
      ball.x = e.x;
    }
  });
  app.stage.on("pointerdown", () => {
    if (mode === "start") {
      sss.play("start");
      sss.playBgm();
      mode = "play";
      app.stage.removeChild(startScreenTextH1);
      app.stage.removeChild(startScreenTextH2);
    } else if (mode === "gameover" || mode === "clear") {
      mode = "start";
      app.stage.removeChild(gameoverTextH1);
      app.stage.removeChild(gameclearTextH1);
      ball.x = 250;
      ball.y = bar.y - 25;
      initializeBlocks();

      app.stage.addChild(startScreenTextH1);
      app.stage.addChild(startScreenTextH2);
    }
  });

  app.ticker.add((delta) => {
    sss.update();
    elapsed += delta;

    if (mode === "play") {
      if (blocks.length === 0) {
        mode = "clear";
        sss.stopBgm();
        sss.play("gameclear");
        app.stage.addChild(gameclearTextH1);
        return;
      }

      ball.x += ballVelocity.x * delta;
      ball.y += ballVelocity.y * delta;

      if (ball.x <= 0 || ball.x >= 500) {
        ballVelocity.x *= -1;
        return;
      } else if (ball.y <= 0) {
        ballVelocity.y *= -1;
        return;
      }

      if (intersect(ball.getBounds(), bar.getBounds())) {
        const barCenter = bar.x + bar.width / 2;
        const hitRate = (ball.x - barCenter) / (bar.width / 2);

        ballVelocity.x = 6 * hitRate;
        ballVelocity.y = -Math.sqrt(36 - ballVelocity.x ** 2);
        sss.play("coin");
        return;
      }

      if (ball.y >= 500) {
        mode = "gameover";
        ball.x = 250;
        ball.y = bar.y - 25;

        ballVelocity = { ...ballVelocityInitial };

        sss.play("gameover");
        sss.stopBgm();

        app.stage.addChild(gameoverTextH1);
        return;
      }

      for (let i = 0; i < blocks.length; i++) {
        if (intersect(ball.getBounds(), blocks[i].getBounds())) {
          ballVelocity.y *= -1;
          app.stage.removeChild(blocks[i]);
          blocks.splice(i, 1);
          sss.playSoundEffect("laser");
        }
      }
    }
  });
};

window.addEventListener("load", () => {
  sss.init();

  main();
});
