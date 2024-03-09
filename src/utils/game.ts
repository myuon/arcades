import { nanoid } from "nanoid";
import * as PIXI from "pixi.js";
import { position, positionInterpolated } from "./container";

export type Type<T> = {
  type: T;
};

class GameEvent {
  constructor(
    public eventName: string,
    public data: unknown,
  ) {}
}

class RemovePluginEvent extends GameEvent {
  constructor(
    public pluginId: string,
    public entityId: string,
  ) {
    super("removePlugin", { pluginId, entityId });
  }
}

export interface Game {
  app: PIXI.Application;
  keys: { [key: string]: boolean };
  keysPressing: { [key: string]: number };
  entities: Entity[];
  canvasSize: { width: number; height: number };
  eventQueue: GameEvent[];
}

export interface Entity {
  id: string;
  graphics: PIXI.DisplayObject;
  position: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    centerX?: boolean;
    centerY?: boolean;
  };
  plugins: {
    name: string;
    onInit?: (game: Game, entity: Entity) => void;
    onRender?: (game: Game, entity: Entity) => void;
    onUnmount?: (game: Game, entity: Entity) => void;
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
      if (!options.condition || !options.condition(entity)) {
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
        if (!(entity.graphics instanceof PIXI.Graphics)) {
          throw new Error("Only PIXI.Graphics supported");
        }

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

export const pluginKeydownOptions = (
  options: {
    key: string;
    onKeydown: (game: Game, entity: Entity) => void;
  }[],
) => {
  return {
    watchKeys: [...options.map((o) => o.key)],
    onKeydown: (game: Game, entity: Entity, key: string) => {
      const option = options.find((o) => o.key === key);
      if (option) {
        option.onKeydown(game, entity);
      }
    },
  };
};

export const pluginKeydown = (options: {
  watchKeys: string[];
  onKeydown: (game: Game, entity: Entity, key: string) => void;
}) => {
  return {
    name: "keydown",
    onRender: (game: Game, entity: Entity) => {
      for (const key of options.watchKeys) {
        if (game.keys[key] && game.keysPressing[key] === 1) {
          options.onKeydown(game, entity, key);
        }
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
  let t = 0;

  return {
    name: "appealEffect",
    onInit: (game: Game, entity: Entity) => {
      if (!(entity.graphics instanceof PIXI.Graphics)) {
        throw new Error("Only PIXI.Graphics supported");
      }

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
      if (!(entity.graphics instanceof PIXI.Graphics)) {
        throw new Error("Only PIXI.Graphics supported");
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
        Game.emit(game, new RemovePluginEvent("appealEffect", entity.id));
      }
    },
  };
};

export namespace Game {
  export const entity = (
    entity: Pick<Entity, "graphics" | "position" | "plugins">,
  ): Entity => {
    return {
      id: nanoid(),
      graphics: entity.graphics,
      position: entity.position,
      plugins: [...entity.plugins],
    };
  };

  export const register = (game: Game, entity: Entity) => {
    game.entities.push(entity);
    Game.initEntity(game, entity);
    game.app.stage.addChild(entity.graphics);
  };

  export const init = (game: Game) => {
    for (const e of game.entities) {
      Game.initEntity(game, e);
    }
  };

  export const initEntity = (game: Game, entity: Entity) => {
    position(entity.graphics, game.canvasSize, entity.position);

    for (const p of entity.plugins) {
      p.onInit?.(game, entity);
    }
  };

  export const render = (game: Game) => {
    for (const l of game.entities) {
      for (const p of l.plugins) {
        p.onRender?.(game, l);
      }
    }

    for (const ev of game.eventQueue) {
      if (ev.eventName === "removePlugin") {
        const event = ev as RemovePluginEvent;
        const entityIndex = game.entities.findIndex(
          (e) => e.id === event.entityId,
        );
        game.entities[entityIndex].plugins = game.entities[
          entityIndex
        ].plugins.filter((p) => p.name !== event.pluginId);
      }
    }

    game.eventQueue = [];

    if (game.entities.length > 10000) {
      throw new Error("Too many entities");
    }
  };

  export const emit = (game: Game, event: GameEvent) => {
    game.eventQueue.push(event);
  };

  export const declare = (game: Game, entities: Entity[]) => {
    for (const e of entities) {
      if (game.entities.find((entity) => entity.id === e.id)) {
        continue;
      }

      Game.register(game, e);
    }

    for (const e of game.entities) {
      if (!entities.find((entity) => entity.id === e.id)) {
        for (const p of e.plugins) {
          p.onUnmount?.(game, e);
        }

        game.app.stage.removeChild(e.graphics);
      }
    }

    game.entities = entities;
  };
}
