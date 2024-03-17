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
    content: string;
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
    cache: string;
    prev: Component;

    constructor() {
      this.container = new PIXI.Container();
      this.cache = "";
      this.prev = {
        type: "none",
      };
    }

    render(component: Component) {
      if (component.type === "component") {
        this.renderComponent(component, {
          container: this.container,
          origin: new PIXI.Point(0, 0),
        });
      }
    }

    display(component: Component) {
      if (hash(component) === this.cache) {
        return;
      }

      console.log("calculate diff");

      this.diff(this.container, this.prev, component);

      this.cache = hash(component);
      this.prev = component;
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
          return this.renderPropsComponent(current.component, {
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
        return this.renderPropsComponent(current, {
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
        const { fontSize, fontFamily, content } = current as TextElementProps;

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

    renderComponent(
      component: Component,
      options: { container: PIXI.Container; origin: PIXI.Point },
    ) {
      if (component.type === "none") {
        return;
      }
      if (component.type === "component") {
        return this.renderPropsComponent(component.component, options);
      }

      throw new Error("Invalid component type");
    }

    renderPropsComponent(
      component: PropsComponent,
      options: {
        container: PIXI.Container;
        origin: PIXI.Point;
      },
    ) {
      if (component.name === "text") {
        const { fontSize, fontFamily, content } =
          component.props as TextElementProps;

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
          this.renderComponent(child, {
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
