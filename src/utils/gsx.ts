import hash from "object-hash";
import * as PIXI from "pixi.js";

export namespace GSX {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  export type PropsRecord = Record<string, any>;

  export interface PropsComponent {
    name: string;
    props: PropsRecord;
    children: Component;
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
        children: {
          type: "none",
        },
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
          return this.renderPropsComponent(container, current.component);
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
        return this.renderPropsComponent(container, current);
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
      }
    }

    renderPropsComponent(container: PIXI.Container, component: PropsComponent) {
      if (component.name === "text") {
        const { fontSize, fontFamily, content } =
          component.props as TextElementProps;

        const text = new PIXI.Text(content, {
          fontFamily: fontFamily ?? "serif",
          fontSize: fontSize ?? 24,
          fill: 0xffffff,
          stroke: 0x0044ff,
        });

        container.addChild(text);
      } else {
        throw new Error(`Unknown component: ${component.name}`);
      }
    }
  }
}
