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

  export class Renderer {
    container: PIXI.Container;
    prev: Component;
    rerender: boolean;

    constructor() {
      this.container = new PIXI.Container();
      this.rerender = true;
      this.prev = {
        type: "none",
      };
    }

    static createDisplayObject(name: PropsComponent["name"]) {
      if (name === "text") {
        return new PIXI.Text("test", {
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

    static renderTo(component: Component, container: PIXI.Container) {
      if (component.type === "none") {
        return;
      }

      const dom = Renderer.createDisplayObject(component.component.name);

      Object.keys(component.component.props ?? {}).forEach((key) => {
        if (key === "children") {
          return;
        }

        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (dom as any)[key] = component.component.props[key];

        console.log("set", key, component.component.props[key]);
      });

      component.component.props.children?.forEach((child: Component) => {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        Renderer.renderTo(child, dom as any);
      });
      container.addChild(dom);
    }

    render(component: Component) {
      if (!this.rerender) {
        return;
      }

      console.log("render");

      Renderer.renderTo(component, this.container);

      if (component.type === "component") {
        // this.reconcile(this.prev, component);
        // const dom = Renderer.createDisplayObject(component.component.name);
      }

      this.prev = component;
      this.rerender = false;
    }

    reconcile(prev: Component, current: Component) {
      const sameType = prev.type === current.type;

      if (sameType) {
        // update
      }
      if (!sameType && current.type === "component") {
        // add
        Renderer.createComponent(current.component, {
          container: this.container,
          origin: new PIXI.Point(0, 0),
        });
      }
      if (!sameType && prev.type === "component") {
        // remove
      }
    }

    diff(container: PIXI.Container, prev: Component, current: Component) {
      if (prev.type === current.type) {
        if (prev.type === "none") {
          return;
        }
        if (prev.type === "component" && current.type === "component") {
          return this.diffPropsComponent(
            container,
            prev.component,
            current.component,
          );
        }

        throw new Error("Invalid component type");
      }
      if (prev.type === "none") {
        if (current.type === "component") {
          return this.createComponent(current.component, {
            container,
            origin: new PIXI.Point(0, 0),
          });
        }

        throw new Error("Invalid component type");
      }
      if (current.type === "none") {
        if (prev.type === "component") {
          container.removeChildAt(0);
        }

        throw new Error("Invalid component type");
      }
    }

    diffPropsComponent(
      container: PIXI.Container,
      prev: PropsComponent,
      current: PropsComponent,
    ) {
      if (prev.name !== current.name) {
        container.removeChildAt(0);
        return this.createComponent(current, {
          container,
          origin: new PIXI.Point(0, 0),
        });
      }

      return this.diffProps(
        container.getChildAt(0),
        prev.name,
        prev.props,
        current.props,
      );
    }

    diffProps(
      container: PIXI.DisplayObject,
      name: PropsComponent["name"],
      prev: PropsRecord,
      current: PropsRecord,
    ) {
      if (name === "text") {
        const text = container as PIXI.Text;
        const {
          fontSize,
          fontFamily,
          text: content,
        } = current as TextElementProps;

        if (fontSize && text.style.fontSize !== fontSize) {
          text.style.fontSize = fontSize;
        }
        if (fontFamily && text.style.fontFamily !== fontFamily) {
          text.style.fontFamily = fontFamily;
        }
        if (prev.content !== content) {
          text.text = content;
        }
      } else if (name === "container") {
        throw new Error("Not implemented");
      }
    }

    static renderComponent(
      component: Component,
      options: { container: PIXI.Container; origin: PIXI.Point },
    ) {
      if (component.type === "none") {
        return;
      }
      if (component.type === "component") {
        return Renderer.createComponent(component.component, options);
      }

      throw new Error("Invalid component type");
    }

    static createComponent(
      component: PropsComponent,
      options: {
        container: PIXI.Container;
        origin: PIXI.Point;
      },
    ) {
      if (component.name === "text") {
        const {
          fontSize,
          fontFamily,
          text: content,
        } = component.props as TextElementProps;

        const text = new PIXI.Text(content, {
          fontFamily: fontFamily ?? "serif",
          fontSize: fontSize ?? 24,
          fill: 0xffffff,
          stroke: 0x0044ff,
        });
        text.x = options.origin.x;
        text.y = options.origin.y;

        options.container.addChild(text);
      } else if (component.name === "container") {
        const { children, layout } = component.props as ContainerProps;

        for (const child of children) {
          Renderer.renderComponent(child, {
            container: options.container,
            origin: options.origin,
          });
          options.origin.x =
            layout.type === "row" ? options.container.width + layout.gap : 0;
          options.origin.y =
            layout.type === "column"
              ? options.container.height + layout.gap
              : 0;
        }
      } else {
        throw new Error(`Unknown component: ${component.name}`);
      }
    }
  }
}
