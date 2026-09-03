import {
  centeredCrop,
  computeResizeDimensions,
  dominantColors,
  extensionFor,
  replaceExtension,
  watermarkOrigin,
  type CropRect,
  type OutputFormat,
  type ResizeOptions,
  type Swatch,
  type WatermarkPosition,
} from "./domain";

export type LoadedImage = {
  id: string;
  file: File;
  bitmap: ImageBitmap;
  width: number;
  height: number;
};

export type ProcessedImage = {
  id: string;
  name: string;
  url: string;
  bytes: number;
  originalBytes: number;
  width: number;
  height: number;
};

export const loadImage = async (file: File): Promise<LoadedImage> => {
  const bitmap = await createImageBitmap(file);
  return {
    id: crypto.randomUUID(),
    file,
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
  };
};

const toBlob = (canvas: HTMLCanvasElement, format: OutputFormat, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("The browser couldn't encode this image.")),
      format,
      quality,
    );
  });

const createCanvas = (
  width: number,
  height: number,
): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser doesn't support canvas rendering.");
  context.imageSmoothingQuality = "high";
  return [canvas, context];
};

/** JPEG has no alpha channel, so transparency would otherwise render as black. */
const fillBackgroundForOpaqueFormats = (
  context: CanvasRenderingContext2D,
  format: OutputFormat,
  width: number,
  height: number,
): void => {
  if (format !== "image/jpeg") return;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
};

const finish = async (
  canvas: HTMLCanvasElement,
  image: LoadedImage,
  format: OutputFormat,
  quality: number,
): Promise<ProcessedImage> => {
  const blob = await toBlob(canvas, format, quality);
  return {
    id: image.id,
    name: replaceExtension(image.file.name, extensionFor(format)),
    url: URL.createObjectURL(blob),
    bytes: blob.size,
    originalBytes: image.file.size,
    width: canvas.width,
    height: canvas.height,
  };
};

export const resizeImage = async (
  image: LoadedImage,
  options: ResizeOptions,
  format: OutputFormat,
  quality: number,
): Promise<ProcessedImage> => {
  const target = computeResizeDimensions({ width: image.width, height: image.height }, options);
  const [canvas, context] = createCanvas(target.width, target.height);
  fillBackgroundForOpaqueFormats(context, format, canvas.width, canvas.height);
  context.drawImage(image.bitmap, 0, 0, target.width, target.height);
  return finish(canvas, image, format, quality);
};

export const reencodeImage = async (
  image: LoadedImage,
  format: OutputFormat,
  quality: number,
): Promise<ProcessedImage> => {
  const [canvas, context] = createCanvas(image.width, image.height);
  fillBackgroundForOpaqueFormats(context, format, canvas.width, canvas.height);
  context.drawImage(image.bitmap, 0, 0);
  return finish(canvas, image, format, quality);
};

export const cropImage = async (
  image: LoadedImage,
  aspect: number,
  format: OutputFormat,
  quality: number,
): Promise<ProcessedImage> => {
  const rect: CropRect = centeredCrop({ width: image.width, height: image.height }, aspect);
  const [canvas, context] = createCanvas(rect.width, rect.height);
  fillBackgroundForOpaqueFormats(context, format, canvas.width, canvas.height);
  context.drawImage(
    image.bitmap,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );
  return finish(canvas, image, format, quality);
};

export type WatermarkOptions = {
  text: string;
  position: WatermarkPosition;
  opacity: number;
  /** Font size as a percentage of the image's shortest side, so it scales with the image. */
  scale: number;
  color: string;
};

export const watermarkImage = async (
  image: LoadedImage,
  options: WatermarkOptions,
  format: OutputFormat,
  quality: number,
): Promise<ProcessedImage> => {
  const [canvas, context] = createCanvas(image.width, image.height);
  fillBackgroundForOpaqueFormats(context, format, canvas.width, canvas.height);
  context.drawImage(image.bitmap, 0, 0);

  const fontSize = Math.max(
    12,
    Math.round((Math.min(image.width, image.height) * options.scale) / 100),
  );
  const margin = Math.round(fontSize * 0.8);
  context.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  context.textBaseline = "top";
  context.globalAlpha = Math.min(1, Math.max(0.05, options.opacity));
  context.fillStyle = options.color;

  const measured = context.measureText(options.text);
  const origin = watermarkOrigin(
    { width: canvas.width, height: canvas.height },
    { width: Math.ceil(measured.width), height: fontSize },
    options.position,
    margin,
  );
  context.fillText(options.text, origin.x, origin.y);
  context.globalAlpha = 1;
  return finish(canvas, image, format, quality);
};

export const borderImage = async (
  image: LoadedImage,
  thickness: number,
  color: string,
  format: OutputFormat,
  quality: number,
): Promise<ProcessedImage> => {
  const pad = Math.max(0, Math.round(thickness));
  const [canvas, context] = createCanvas(image.width + pad * 2, image.height + pad * 2);
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image.bitmap, pad, pad);
  return finish(canvas, image, format, quality);
};

/** Samples the image down before reading pixels — a full-size read is needlessly slow. */
export const extractColors = (image: LoadedImage, max = 6): Swatch[] => {
  const sample = 120;
  const scale = Math.min(1, sample / Math.max(image.width, image.height));
  const [canvas, context] = createCanvas(
    Math.max(1, Math.round(image.width * scale)),
    Math.max(1, Math.round(image.height * scale)),
  );
  context.drawImage(image.bitmap, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  return dominantColors(data, max);
};

export const downloadProcessed = (item: ProcessedImage): void => {
  const link = document.createElement("a");
  link.href = item.url;
  link.download = item.name;
  link.click();
};
