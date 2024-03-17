import * as PIXI from "pixi.js";

export namespace GSX {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  export type PropsRecord = Record<string, any>;

  export interface PropsComponent {
    name: string;
    props: PropsRecord;
  }
  export type Component =
    | {
        type: "component";
        component: PropsComponent;
      }
    | {
        type: "none";
      };

  export interface TextElementProps {
    fontSize?: number;
    fontFamily?: string;
    text: string;
  }

  export const text = (props: TextElementProps): Component => {
    return {
      type: "component",
      component: {
        name: "text",
        props,
      },
    };
  };

  export interface ContainerProps {
    layout: {
      type: "row" | "column";
      gap: number;
    };
    children: Component[];
  }

  export const container = (props: ContainerProps): Component => {
    return {
      type: "component",
      component: {
        name: "container",
        props,
      },
    };
  };

  interface Fiber {
    dom?: PIXI.Container;
    name?: string;
    props: PropsRecord;
    parent?: Fiber;
    child?: Fiber;
    next?: Fiber;
    alternate?: Fiber;
    effectTag?: "PLACEMENT" | "UPDATE" | "DELETION";
  }

  export class Renderer {
    container: PIXI.Container;
    prev: Fiber | undefined;
    rerender: boolean;

    constructor() {
      this.container = new PIXI.Container();
      this.rerender = true;
    }

    static createDisplayObject(name: PropsComponent["name"]) {
      if (name === "text") {
        return new PIXI.Text("", {
          fill: 0xffffff,
          stroke: 0x0044ff,
        });
      }
      if (name === "container") {
        const container = new PIXI.Container();
        let layout: ContainerProps["layout"] | undefined;

        const arrange = () => {
          const origin = new PIXI.Point(0, 0);

          for (const child of container.children) {
            child.x = origin.x;
            child.y = origin.y;
            const bounds = child.getBounds();

            origin.x += layout?.type === "row" ? bounds.width + layout.gap : 0;
            origin.y +=
              layout?.type === "column" ? bounds.height + layout.gap : 0;
          }
        };

        container.addChild = function <U extends PIXI.DisplayObject[]>(
          ...children: U
        ): U[0] {
          const value = PIXI.Container.prototype.addChild.call(
            this,
            ...children,
          );
          arrange();

          return value;
        };

        return new Proxy(container, {
          set: (target, key, value) => {
            if (key === "layout") {
              layout = value;
              arrange();

              return true;
            }

            return Reflect.set(target, key, value);
          },
        });
      }

      throw new Error(`Unknown component: ${name}`);
    }

    static createDom(fiber: Fiber) {
      if (!fiber.name) {
        throw new Error("Empty fiber name");
      }

      const dom = Renderer.createDisplayObject(fiber.name);

      Object.keys(fiber.props ?? {})
        // isProperty
        .filter((name) => name !== "children")
        .forEach((key) => {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (dom as any)[key] = fiber.props[key];
        });

      return dom;
    }

    static updateDom(
      dom: PIXI.DisplayObject,
      prevProps: PropsRecord,
      currentProps: PropsRecord,
    ) {
      Object.keys(prevProps)
        .filter((key) => key !== "children")
        .filter((key) => !(key in currentProps))
        .forEach((key) => {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (dom as any)[key] = undefined;
        });

      Object.keys(currentProps)
        .filter((key) => key !== "children")
        .filter((key) => !(key in prevProps))
        .forEach((key) => {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (dom as any)[key] = currentProps[key];
        });
    }

    static commitFiber(fiber: Fiber) {
      if (!fiber.dom) {
        throw new Error("Empty fiber dom");
      }

      if (fiber.effectTag === "PLACEMENT") {
        fiber.parent?.dom?.addChild(fiber.dom);
      } else if (fiber.effectTag === "DELETION") {
        fiber.parent?.dom?.removeChild(fiber.dom);
      } else if (fiber.effectTag === "UPDATE") {
        Renderer.updateDom(
          fiber.dom,
          fiber.alternate?.props ?? {},
          fiber.props,
        );
      }
    }

    static reconcileChildren(
      fiber: Fiber,
      components: Component[] | undefined,
    ) {
      let oldFiber = fiber.alternate?.child;
      let prevFiber: Fiber = fiber;

      let index = 0;

      while (index < (components ?? []).length || oldFiber) {
        const child = components?.[index];
        const sameType =
          child?.type === "component" &&
          oldFiber?.name === child.component.name;

        const newFiber: Fiber = sameType
          ? {
              dom: oldFiber?.dom,
              name: oldFiber?.name,
              props: child.component.props,
              parent: fiber,
              alternate: oldFiber,
              effectTag: "UPDATE",
            }
          : child?.type === "component"
            ? {
                dom: undefined,
                name: child.component.name,
                props: child.component.props,
                parent: fiber,
                effectTag: "PLACEMENT",
              }
            : {
                ...oldFiber,
                props: oldFiber?.props ?? {},
                effectTag: "DELETION",
              };

        if (index === 0) {
          prevFiber.child = newFiber;
        } else {
          prevFiber.next = newFiber;
        }

        if (oldFiber) {
          oldFiber = oldFiber.next;
        }

        prevFiber = newFiber;
        index++;

        Renderer.processFiber(newFiber);
      }
    }

    static processFiber(fiber: Fiber) {
      if (!fiber.dom) {
        fiber.dom = Renderer.createDom(fiber);
      }

      Renderer.reconcileChildren(
        fiber,
        fiber.props.children as Component[] | undefined,
      );
      Renderer.commitFiber(fiber);
    }

    static renderTo(
      component: Component,
      container: PIXI.Container,
      prev: Fiber | undefined,
    ) {
      if (component.type === "none") {
        return;
      }

      const rootFiber: Fiber = {
        dom: container,
        props: {
          children: [component],
        },
        alternate: prev,
      };

      Renderer.processFiber(rootFiber);

      return rootFiber;
    }

    render(component: Component) {
      if (!this.rerender) {
        return;
      }

      this.prev = Renderer.renderTo(component, this.container, this.prev);
      this.rerender = false;
    }
  }
}
