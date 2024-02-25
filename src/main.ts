import * as PIXI from "pixi.js";
import * as sss from "sounds-some-sounds";

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

  for (let j = 0; j < blockNum.y; j++) {
    for (let i = 0; i < blockNum.x; i++) {
      const block = new PIXI.Graphics();
      block.beginFill(0x0000ff + 0xff0000 * (j / blockNum.y));
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

  let start = false;

  let elapsed = 0.0;

  app.stage.on("pointermove", (e: PIXI.FederatedPointerEvent) => {
    bar.x = e.x - bar.width / 2;

    if (!start) {
      ball.x = e.x;
    }
  });
  app.stage.on("pointerdown", () => {
    start = true;
    sss.play("start");
    sss.playBgm();
  });

  app.ticker.add((delta) => {
    sss.update();
    elapsed += delta;

    if (start) {
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
        start = false;
        ball.x = 250;
        ball.y = bar.y - 25;

        ballVelocity = { ...ballVelocityInitial };
        return;
      }

      for (let i = 0; i < blocks.length; i++) {
        if (intersect(ball.getBounds(), blocks[i].getBounds())) {
          ballVelocity.y *= -1;
          app.stage.removeChild(blocks[i]);
          blocks.splice(i, 1);
          sss.play("laser");
          return;
        }
      }
    }
  });
};

window.addEventListener("load", () => {
  sss.init();

  main();
});
