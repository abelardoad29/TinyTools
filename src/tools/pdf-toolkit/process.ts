import { outputName, pageNumberOrigin, type NumberPosition, type Rotation } from "./domain";

export type PdfResult = { id: string; name: string; url: string; bytes: number; pages: number };

/**
 * pdf-lib is ~400kB, and only this tool needs it. Importing it here (rather than at
 * module scope) keeps it out of the main bundle until someone actually runs an action.
 */
const pdfLib = () => import("pdf-lib");

const toResult = (name: string, bytes: Uint8Array, pages: number): PdfResult => {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  return {
    id: crypto.randomUUID(),
    name,
    url: URL.createObjectURL(blob),
    bytes: blob.size,
    pages,
  };
};

export const readPageCount = async (file: File): Promise<number> => {
  const { PDFDocument } = await pdfLib();
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  return doc.getPageCount();
};

export const mergePdfs = async (files: File[]): Promise<PdfResult> => {
  const { PDFDocument } = await pdfLib();
  const merged = await PDFDocument.create();
  for (const file of files) {
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  const bytes = await merged.save();
  return toResult(
    outputName(files[0]?.name ?? "document.pdf", "merged"),
    bytes,
    merged.getPageCount(),
  );
};

export const extractPages = async (
  file: File,
  indices: number[],
  suffix = "pages",
): Promise<PdfResult> => {
  const { PDFDocument } = await pdfLib();
  const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const target = await PDFDocument.create();
  const pages = await target.copyPages(source, indices);
  pages.forEach((page) => target.addPage(page));
  const bytes = await target.save();
  return toResult(outputName(file.name, suffix), bytes, target.getPageCount());
};

export const splitPdf = async (file: File, chunks: number[][]): Promise<PdfResult[]> => {
  const results: PdfResult[] = [];
  for (const [index, chunk] of chunks.entries()) {
    results.push(await extractPages(file, chunk, `part-${index + 1}`));
  }
  return results;
};

export const rotatePdf = async (
  file: File,
  angle: Rotation,
  indices: number[] | null,
): Promise<PdfResult> => {
  const { PDFDocument, degrees } = await pdfLib();
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const targets = indices ?? doc.getPageIndices();
  for (const index of targets) {
    const page = doc.getPage(index);
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }
  const bytes = await doc.save();
  return toResult(outputName(file.name, "rotated"), bytes, doc.getPageCount());
};

export const imagesToPdf = async (files: File[]): Promise<PdfResult> => {
  const { PDFDocument } = await pdfLib();
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const embedded = file.type.includes("png")
      ? await doc.embedPng(bytes)
      : await doc.embedJpg(bytes);
    const page = doc.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  }
  const saved = await doc.save();
  return toResult("images.pdf", saved, doc.getPageCount());
};

export const addPageNumbers = async (
  file: File,
  position: NumberPosition,
  startAt: number,
  fontSize: number,
): Promise<PdfResult> => {
  const { PDFDocument, StandardFonts, rgb } = await pdfLib();
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages().forEach((page, index) => {
    const label = String(startAt + index);
    const width = font.widthOfTextAtSize(label, fontSize);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const origin = pageNumberOrigin({ width: pageWidth, height: pageHeight }, width, position, 28);
    page.drawText(label, {
      x: origin.x,
      y: origin.y,
      size: fontSize,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
  });
  const bytes = await doc.save();
  return toResult(outputName(file.name, "numbered"), bytes, doc.getPageCount());
};

export type PdfMetadata = {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  producer: string;
  creator: string;
  pages: number;
};

export const readMetadata = async (file: File): Promise<PdfMetadata> => {
  const { PDFDocument } = await pdfLib();
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: (doc.getKeywords() ?? "").toString(),
    producer: doc.getProducer() ?? "",
    creator: doc.getCreator() ?? "",
    pages: doc.getPageCount(),
  };
};

export const writeMetadata = async (
  file: File,
  metadata: Omit<PdfMetadata, "pages" | "producer">,
): Promise<PdfResult> => {
  const { PDFDocument } = await pdfLib();
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  doc.setTitle(metadata.title);
  doc.setAuthor(metadata.author);
  doc.setSubject(metadata.subject);
  doc.setKeywords(metadata.keywords ? metadata.keywords.split(",").map((k) => k.trim()) : []);
  doc.setCreator(metadata.creator);
  const bytes = await doc.save();
  return toResult(outputName(file.name, "metadata"), bytes, doc.getPageCount());
};

export const downloadPdf = (item: PdfResult): void => {
  const link = document.createElement("a");
  link.href = item.url;
  link.download = item.name;
  link.click();
};
