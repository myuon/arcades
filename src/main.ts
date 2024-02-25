import * as PIXI from "pixi.js";

const app = new PIXI.Application({ width: 640, height: 360 });
document.body.appendChild(app.view as unknown as Node);

const character = new PIXI.Graphics();
character.beginFill(0xff0000);
character.drawRect(0, 0, 32, 32);
character.endFill();

const sprite = character;
app.stage.addChild(sprite);

let elapsed = 0.0;
app.ticker.add((delta) => {
  elapsed += delta;
  sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0;
});
