import hash from "object-hash";
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
    dom: PIXI.Container | null;
    name?: string;
    props: PropsRecord;
    parent?: Fiber;
    child?: Fiber;
    next?: Fiber;
    alternate?: Fiber;
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

            origin.x = layout?.type === "row" ? bounds.width + layout.gap : 0;
            origin.y =
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

    static processFiber(fiber: Fiber) {
      if (!fiber.dom) {
        fiber.dom = Renderer.createDom(fiber);
      }

      if (fiber.parent) {
        fiber.parent.dom?.addChild(fiber.dom);
      }

      let prevFiber: Fiber = fiber;
      (fiber.props.children as Component[])?.forEach((child, index) => {
        if (child.type === "component") {
          const newFiber = {
            dom: null,
            name: child.component.name,
            props: child.component.props,
            parent: fiber,
          };

          if (index === 0) {
            prevFiber.child = newFiber;
          } else {
            prevFiber.next = newFiber;
          }

          Renderer.processFiber(newFiber);

          prevFiber = newFiber;
        }
      });
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

      console.log("render");

      this.prev = Renderer.renderTo(component, this.container, this.prev);
      this.rerender = false;

      console.log(this.prev);
    }

    // diff(container: PIXI.Container, prev: Component, current: Component) {
    //   if (prev.type === current.type) {
    //     if (prev.type === "none") {
    //       return;
    //     }
    //     if (prev.type === "component" && current.type === "component") {
    //       return this.diffPropsComponent(
    //         container,
    //         prev.component,
    //         current.component,
    //       );
    //     }

    //     throw new Error("Invalid component type");
    //   }
    //   if (prev.type === "none") {
    //     if (current.type === "component") {
    //       return this.createComponent(current.component, {
    //         container,
    //         origin: new PIXI.Point(0, 0),
    //       });
    //     }

    //     throw new Error("Invalid component type");
    //   }
    //   if (current.type === "none") {
    //     if (prev.type === "component") {
    //       container.removeChildAt(0);
    //     }

    //     throw new Error("Invalid component type");
    //   }
    // }

    // diffPropsComponent(
    //   container: PIXI.Container,
    //   prev: PropsComponent,
    //   current: PropsComponent,
    // ) {
    //   if (prev.name !== current.name) {
    //     container.removeChildAt(0);
    //     return this.createComponent(current, {
    //       container,
    //       origin: new PIXI.Point(0, 0),
    //     });
    //   }

    //   return this.diffProps(
    //     container.getChildAt(0),
    //     prev.name,
    //     prev.props,
    //     current.props,
    //   );
    // }

    // diffProps(
    //   container: PIXI.DisplayObject,
    //   name: PropsComponent["name"],
    //   prev: PropsRecord,
    //   current: PropsRecord,
    // ) {
    //   if (name === "text") {
    //     const text = container as PIXI.Text;
    //     const {
    //       fontSize,
    //       fontFamily,
    //       text: content,
    //     } = current as TextElementProps;

    //     if (fontSize && text.style.fontSize !== fontSize) {
    //       text.style.fontSize = fontSize;
    //     }
    //     if (fontFamily && text.style.fontFamily !== fontFamily) {
    //       text.style.fontFamily = fontFamily;
    //     }
    //     if (prev.content !== content) {
    //       text.text = content;
    //     }
    //   } else if (name === "container") {
    //     throw new Error("Not implemented");
    //   }
    // }

    // static renderComponent(
    //   component: Component,
    //   options: { container: PIXI.Container; origin: PIXI.Point },
    // ) {
    //   if (component.type === "none") {
    //     return;
    //   }
    //   if (component.type === "component") {
    //     return Renderer.createComponent(component.component, options);
    //   }

    //   throw new Error("Invalid component type");
    // }

    // static createComponent(
    //   component: PropsComponent,
    //   options: {
    //     container: PIXI.Container;
    //     origin: PIXI.Point;
    //   },
    // ) {
    //   if (component.name === "text") {
    //     const {
    //       fontSize,
    //       fontFamily,
    //       text: content,
    //     } = component.props as TextElementProps;

    //     const text = new PIXI.Text(content, {
    //       fontFamily: fontFamily ?? "serif",
    //       fontSize: fontSize ?? 24,
    //       fill: 0xffffff,
    //       stroke: 0x0044ff,
    //     });
    //     text.x = options.origin.x;
    //     text.y = options.origin.y;

    //     options.container.addChild(text);
    //   } else if (component.name === "container") {
    //     const { children, layout } = component.props as ContainerProps;

    //     for (const child of children) {
    //       Renderer.renderComponent(child, {
    //         container: options.container,
    //         origin: options.origin,
    //       });
    //       options.origin.x =
    //         layout.type === "row" ? options.container.width + layout.gap : 0;
    //       options.origin.y =
    //         layout.type === "column"
    //           ? options.container.height + layout.gap
    //           : 0;
    //     }
    //   } else {
    //     throw new Error(`Unknown component: ${component.name}`);
    //   }
    // }
  }
}
