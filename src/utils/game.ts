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
  plugins: {
    name: string;
    onInit?: (game: Game, entity: Entity) => void;
    onRender?: (game: Game, entity: Entity) => void;
  }[];
}

export const pluginMoveByArrowKeys = (options: {
  speed: number;
  clampedBy?: {
    width: number;
    height: number;
  };
  condition?: (entity: Entity) => boolean;
}) => {
  return {
    name: "moveByArrowKeys",
    onRender: (game: Game, entity: Entity) => {
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
    },
  };
};

export const pluginAppealEffect = (options: {
  from: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    centerX?: boolean;
    centerY?: boolean;
  };
  start?: () => boolean;
}) => {
  let isDone = false;
  let t = 0;

  return {
    name: "appealEffect",
    onInit: (game: Game, entity: Entity) => {
      positionInterpolated(
        entity.graphics,
        t,
        {
          containerSize: game.canvasSize,
          layout: options.from,
        },
        {
          containerSize: game.canvasSize,
          layout: entity.position,
        },
      );
    },
    onRender: (game: Game, entity: Entity) => {
      if (isDone) {
        return;
      }

      t += 1 / 30;
      positionInterpolated(
        entity.graphics,
        t,
        {
          containerSize: game.canvasSize,
          layout: options.from,
        },
        {
          containerSize: game.canvasSize,
          layout: entity.position,
        },
      );

      if (t >= 1) {
        isDone = true;
      }
    },
  };
};

export namespace Game {
  export const register = (
    game: Game,
    entity: Pick<Entity, "graphics" | "position" | "plugins">,
  ) => {
    game.entities.push({
      graphics: entity.graphics,
      position: entity.position,
      state: {
        type: "none",
        exists: false,
        t: 0,
        variables: {},
      },
      plugins: [...entity.plugins],
    });
    position(entity.graphics, game.canvasSize, entity.position);
    game.app.stage.addChild(entity.graphics);
  };

  export const init = (game: Game) => {
    for (const e of game.entities) {
      for (const p of e.plugins) {
        p.onInit?.(game, e);
      }
    }
  };

  export const render = (game: Game) => {
    for (const l of game.entities) {
      for (const p of l.plugins) {
        p.onRender?.(game, l);
      }
    }
  };
}
