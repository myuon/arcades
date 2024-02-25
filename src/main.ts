import * as PIXI from "pixi.js";

const intersect = (a: PIXI.Rectangle, b: PIXI.Rectangle) => {
  return (
    a.x + a.width > b.x &&
    a.x < b.x + b.width &&
    a.y + a.height > b.y &&
    a.y < b.y + b.height
  );
};

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

const blocks: PIXI.Graphics[] = [];

for (let j = 0; j < 4; j++) {
  for (let i = 0; i < 4; i++) {
    const block = new PIXI.Graphics();
    block.beginFill(0x0000ff);
    block.drawRect(0, 0, 100, 20);
    block.endFill();
    block.x = i * 120 + 25;
    block.y = j * 30 + 25;

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

let ballVelocity = { x: 4, y: -4 };

let start = false;

app.stage.on("mousemove", (e: PIXI.FederatedPointerEvent) => {
  bar.x = e.x - bar.width / 2;

  if (!start) {
    ball.x = e.x;
  }
});
app.stage.on("click", () => {
  start = true;
});

let elapsed = 0.0;
app.ticker.add((delta) => {
  elapsed += delta;

  if (start) {
    ball.x += ballVelocity.x * delta;
    ball.y += ballVelocity.y * delta;

    if (ball.x <= 0 || ball.x >= 500) {
      ballVelocity.x *= -1;
    } else if (ball.y <= 0) {
      ballVelocity.y *= -1;
    }

    if (intersect(ball.getBounds(), bar.getBounds())) {
      ballVelocity.y *= -1;
    }

    if (ball.y >= 500) {
      start = false;
      ball.x = 250;
      ball.y = bar.y - 25;
    }

    for (let i = 0; i < blocks.length; i++) {
      if (intersect(ball.getBounds(), blocks[i].getBounds())) {
        ballVelocity.y *= -1;
        app.stage.removeChild(blocks[i]);
        blocks.splice(i, 1);
        break;
      }
    }
  }
});
