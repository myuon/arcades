import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import * as sss from "sounds-some-sounds";
import { arrangeHorizontal, asContainer, centerize } from "../utils/container";
import { createGraphics } from "../utils/graphics";
import { intersectRectWithLine } from "../utils/intersect";

const keys: { [key: string]: boolean } = {};

const characterGraphicsL = [
  " l  l  ",
  " lllll ",
  "l     l",
  "l l   l",
  "l     l",
  " lllll",
  " l  l",
];
const characterGraphicsR = [
  "  l  l ",
  " lllll ",
  "l     l",
  "l   l l",
  "l     l",
  " lllll",
  "  l  l",
];

const main = () => {
  const canvasSize = { width: 500, height: 500 };
  const groundY = 380;
  const app = new PIXI.Application({
    width: canvasSize.width,
    height: canvasSize.height,
  });
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;

  let mode: "start" | "play" | "gameover" = "start";

  const characterL = app.renderer.generateTexture(
    createGraphics(characterGraphicsL),
  );
  const characterR = app.renderer.generateTexture(
    createGraphics(characterGraphicsR),
  );

  const character = new PIXI.Sprite(characterL);
  character.x = 250 - character.width / 2;
  character.y = groundY - character.height;

  app.stage.addChild(character);

  const ground = new PIXI.Graphics();
  ground.beginFill(0xffffff);
  ground.drawRect(0, 0, 500, 1);
  ground.endFill();
  ground.y = groundY;

  app.stage.addChild(ground);

  let elapsed = 0.0;

  const gameStartLayer = asContainer(
    new PIXI.Text("RAINS", {
      fontFamily: "serif",
      fontSize: 64,
      fill: 0xffffff,
      stroke: 0x0044ff,
    }),
    new PIXI.Text("ARROW KEYS TO MOVE", {
      fontFamily: "serif",
      fontSize: 24,
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

  const scoreText = new PIXI.Text("SCORE: 0", {
    fontFamily: "serif",
    fontSize: 18,
    fill: 0xffffff,
    stroke: 0x0044ff,
  });
  scoreText.x = 10;
  scoreText.y = 10;
  app.stage.addChild(scoreText);

  let raindrops: {
    graphics: PIXI.Graphics;
    angle: number;
    visited: boolean;
  }[] = [];

  let angle = 0;
  let score = 0;

  let particles: {
    graphics: PIXI.Graphics;
    velocity: PIXI.Point;
    life: number;
  }[] = [];

  app.ticker.add((delta) => {
    sss.update();
    elapsed += delta;

    if (mode === "start") {
      if (keys.ArrowLeft || keys.ArrowRight) {
        mode = "play";

        app.stage.removeChild(gameStartLayer);

        sss.playBgm("RAINS");
      }
    } else if (mode === "play") {
      if (Math.random() < 0.15) {
        angle += Math.random() * 0.1 - 0.05;
        angle = Math.max(-Math.PI * 0.2, Math.min(Math.PI * 0.2, angle));

        const raindrop = new PIXI.Graphics();
        raindrop.beginFill(0xffffff);
        raindrop.drawRect(0, 0, 2, 25);
        raindrop.endFill();
        raindrop.x = Math.random() * 500;
        raindrop.y = -raindrop.height;
        raindrop.rotation = angle;

        raindrops.push({
          graphics: raindrop,
          angle: angle + Math.PI * 0.5,
          visited: false,
        });
        app.stage.addChild(raindrop);
      }

      if (keys.ArrowLeft) {
        character.x -= 5;
        character.texture = characterL;
      } else if (keys.ArrowRight) {
        character.x += 5;
        character.texture = characterR;
      }

      character.x = Math.max(
        0,
        Math.min(canvasSize.width - character.width, character.x),
      );

      for (const raindrop of raindrops) {
        raindrop.graphics.y += 5 * Math.sin(raindrop.angle);
        raindrop.graphics.x += 5 * Math.cos(raindrop.angle);

        if (raindrop.graphics.y > canvasSize.height) {
          app.stage.removeChild(raindrop.graphics);
          raindrops.splice(raindrops.indexOf(raindrop), 1);
        }

        const raindropPath = [
          new PIXI.Point(raindrop.graphics.x, raindrop.graphics.y),
          new PIXI.Point(
            raindrop.graphics.x +
              raindrop.graphics.height * Math.cos(raindrop.angle),
            raindrop.graphics.y +
              raindrop.graphics.height * Math.sin(raindrop.angle),
          ),
        ] as [PIXI.Point, PIXI.Point];

        if (
          intersectRectWithLine(character.getBounds().pad(-5), raindropPath)
        ) {
          mode = "gameover";
          app.stage.addChild(gameOverLayer);

          sss.play("gameover");
          sss.stopBgm();
          break;
        }

        if (
          intersectRectWithLine(character.getBounds().pad(25), raindropPath)
        ) {
          if (!raindrop.visited) {
            score += 10;
            scoreText.text = `SCORE: ${score}`;
            raindrop.visited = true;

            raindrop.graphics.clear();
            raindrop.graphics.beginFill(0x00ff00);
            raindrop.graphics.drawRect(0, 0, 2, 25);
            raindrop.graphics.endFill();

            sss.playSoundEffect("hit");
          }

          if (Math.random() < 0.35) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0xffffff);

            const size = 2 + 6 * Math.random();
            particle.drawRect(0, 0, size, size);
            particle.endFill();
            particle.x = character.x + character.width / 2;
            particle.y = character.y + character.height / 2;
            app.stage.addChild(particle);
            particles.push({
              graphics: particle,
              velocity: new PIXI.Point(Math.random() * 10 - 5, -5),
              life: 1.0,
            });
          }
        }
      }

      for (const particle of particles) {
        particle.graphics.x += particle.velocity.x;
        particle.graphics.y += particle.velocity.y;
        particle.velocity.y += 0.5;
        particle.life -= 0.01;

        particle.graphics.alpha = particle.life;

        if (particle.life <= 0) {
          app.stage.removeChild(particle.graphics);
          particles.splice(particles.indexOf(particle), 1);
        }
      }
    } else if (mode === "gameover") {
      if (keys.Enter) {
        mode = "start";

        app.stage.removeChild(gameOverLayer);

        character.x = 250 - character.width / 2;
        score = 0;
        scoreText.text = `SCORE: ${score}`;
        for (const raindrop of raindrops) {
          app.stage.removeChild(raindrop.graphics);
        }
        raindrops = [];
        for (const particle of particles) {
          app.stage.removeChild(particle.graphics);
        }
        particles = [];

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
