import * as PIXI from "pixi.js";
import { position, positionInterpolated } from "./container";

export interface Game {
  app: PIXI.Application;
  keys: { [key: string]: boolean };
  entities: Entity[];
  canvasSize: { width: number; height: number };
}

export interface Entity {
  graphics: PIXI.Graphics;
  position: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    centerX?: boolean;
    centerY?: boolean;
  };
  state: {
    type: "none" | "waiting" | "appeal" | "done";
    exists: boolean;
    t: number;
    variables: Record<string, unknown>;
  };
  effects: {
    appeal?: {
      type: "move";
      from: {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
        centerX?: boolean;
        centerY?: boolean;
      };
      start?: () => boolean;
    };
  };
  plugins: ((game: Game, entity: Entity) => void)[];
  hooks: {
    onRender: (game: Game, entity: Entity) => void;
  }[];
}

export const pluginMoveByArrowKeys =
  (options: {
    speed: number;
    clampedBy?: {
      width: number;
      height: number;
    };
    condition?: (entity: Entity) => boolean;
  }) =>
  (game: Game, entity: Entity) => {
    if (options.condition && !options.condition(entity)) {
      return;
    }

    if (game.keys.ArrowLeft) {
      entity.graphics.x -= options.speed;
    }
    if (game.keys.ArrowRight) {
      entity.graphics.x += options.speed;
    }
    if (game.keys.ArrowUp) {
      entity.graphics.y -= options.speed;
    }
    if (game.keys.ArrowDown) {
      entity.graphics.y += options.speed;
    }

    if (options.clampedBy) {
      entity.graphics.x = Math.max(
        0,
        Math.min(
          options.clampedBy.width - entity.graphics.width,
          entity.graphics.x,
        ),
      );
      entity.graphics.y = Math.max(
        0,
        Math.min(
          options.clampedBy.height - entity.graphics.height,
          entity.graphics.y,
        ),
      );
    }
  };

export namespace Game {
  export const render = (game: Game) => {
    for (const l of game.entities) {
      if (!l.state.exists) {
        position(l.graphics, game.canvasSize, l.position);
        l.state.exists = true;
        game.app.stage.addChild(l.graphics);

        if (l.effects.appeal) {
          if (l.effects.appeal.type === "move") {
            position(l.graphics, game.canvasSize, l.effects.appeal.from);
            l.state.type = "waiting";
          }
        }
      }

      if (l.state.type === "waiting") {
        if (l.effects.appeal?.start?.()) {
          l.state.type = "appeal";
          l.state.t = 0;
        }
      }

      if (l.state.type === "appeal" && l.effects.appeal) {
        l.state.t += 1 / 30;
        positionInterpolated(
          l.graphics,
          l.state.t,
          {
            containerSize: game.canvasSize,
            layout: l.effects.appeal.from,
          },
          {
            containerSize: game.canvasSize,
            layout: l.position,
          },
        );

        if (l.state.t >= 1) {
          l.state.type = "done";
        }
      }

      for (const p of l.plugins) {
        p(game, l);
      }

      for (const h of l.hooks) {
        h.onRender(game, l);
      }
    }
  };
}
