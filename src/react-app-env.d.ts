/// <reference types="react-scripts" />

interface OffscreenCanvas {
  width: number;
  height: number;
  getContext(contextId: "2d"): OffscreenCanvasRenderingContext2D | null;
  convertToBlob(options?: { type?: string; quality?: number }): Promise<Blob>;
}

interface OffscreenCanvasRenderingContext2D {
  drawImage(image: CanvasImageSource, dx: number, dy: number): void;
}

declare var OffscreenCanvas: {
  prototype: OffscreenCanvas;
  new (width: number, height: number): OffscreenCanvas;
};

module "babel-plugin-relay/macro" {
  export default (str: TemplateStringsArray) => any;
}

module "*.mp3" {
  export default string;
}

interface SVGElement extends Element {
  beginElement(): SVGElement;
}
