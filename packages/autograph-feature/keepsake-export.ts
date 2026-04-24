type RasterExportMimeType = "image/png" | "image/jpeg" | "image/gif";

export function downloadKeepsakeText(filename: string, text: string) {
  if (typeof document === "undefined") {
    return;
  }

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadKeepsakeBlob(filename: string, blob: Blob) {
  if (typeof document === "undefined") {
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function writeUint16(target: number[], value: number) {
  target.push(value & 0xff, (value >> 8) & 0xff);
}

function createGif332Palette(): Uint8Array {
  const palette = new Uint8Array(256 * 3);

  for (let index = 0; index < 256; index += 1) {
    const red = ((index >> 5) & 0x07) * 255 / 7;
    const green = ((index >> 2) & 0x07) * 255 / 7;
    const blue = (index & 0x03) * 255 / 3;
    const offset = index * 3;

    palette[offset] = Math.round(red);
    palette[offset + 1] = Math.round(green);
    palette[offset + 2] = Math.round(blue);
  }

  return palette;
}

function rgbaToGifIndices(rgba: Uint8ClampedArray): Uint8Array {
  const indices = new Uint8Array(Math.floor(rgba.length / 4));

  for (let pixel = 0; pixel < indices.length; pixel += 1) {
    const offset = pixel * 4;
    const red = rgba[offset] >> 5;
    const green = rgba[offset + 1] >> 5;
    const blue = rgba[offset + 2] >> 6;
    indices[pixel] = (red << 5) | (green << 2) | blue;
  }

  return indices;
}

function lzwEncodeGifIndices(indices: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const endCode = clearCode + 1;

  const output: number[] = [];
  let bitBuffer = 0;
  let bitLength = 0;

  let codeSize = minCodeSize + 1;
  let nextCode = endCode + 1;
  let maxCode = 1 << codeSize;
  const dictionary = new Map<string, number>();

  const flushCode = (code: number) => {
    bitBuffer |= code << bitLength;
    bitLength += codeSize;

    while (bitLength >= 8) {
      output.push(bitBuffer & 0xff);
      bitBuffer >>= 8;
      bitLength -= 8;
    }
  };

  const resetDictionary = () => {
    dictionary.clear();
    codeSize = minCodeSize + 1;
    nextCode = endCode + 1;
    maxCode = 1 << codeSize;
  };

  flushCode(clearCode);
  resetDictionary();

  let prefix = indices[0] ?? 0;

  for (let cursor = 1; cursor < indices.length; cursor += 1) {
    const value = indices[cursor];
    const key = `${prefix},${value}`;
    const existing = dictionary.get(key);

    if (existing !== undefined) {
      prefix = existing;
      continue;
    }

    flushCode(prefix);

    if (nextCode < 4096) {
      dictionary.set(key, nextCode);
      nextCode += 1;

      if (nextCode === maxCode && codeSize < 12) {
        codeSize += 1;
        maxCode = 1 << codeSize;
      }
    } else {
      flushCode(clearCode);
      resetDictionary();
    }

    prefix = value;
  }

  flushCode(prefix);
  flushCode(endCode);

  if (bitLength > 0) {
    output.push(bitBuffer & 0xff);
  }

  return new Uint8Array(output);
}

function buildGifDataSubBlocks(data: Uint8Array): Uint8Array {
  const blocks: number[] = [];
  let offset = 0;

  while (offset < data.length) {
    const size = Math.min(255, data.length - offset);
    blocks.push(size);

    for (let index = 0; index < size; index += 1) {
      blocks.push(data[offset + index]);
    }

    offset += size;
  }

  blocks.push(0);
  return new Uint8Array(blocks);
}

function encodeGifFrame(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const palette = createGif332Palette();
  const indices = rgbaToGifIndices(rgba);
  const compressed = lzwEncodeGifIndices(indices, 8);
  const imageDataBlocks = buildGifDataSubBlocks(compressed);

  const bytes: number[] = [];

  bytes.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
  writeUint16(bytes, width);
  writeUint16(bytes, height);
  bytes.push(0xf7, 0x00, 0x00);
  for (let index = 0; index < palette.length; index += 1) {
    bytes.push(palette[index]);
  }

  bytes.push(0x21, 0xf9, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00);
  bytes.push(0x2c);
  writeUint16(bytes, 0);
  writeUint16(bytes, 0);
  writeUint16(bytes, width);
  writeUint16(bytes, height);
  bytes.push(0x00);
  bytes.push(0x08);
  for (let index = 0; index < imageDataBlocks.length; index += 1) {
    bytes.push(imageDataBlocks[index]);
  }
  bytes.push(0x3b);

  return new Uint8Array(bytes);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.decoding = "async";

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to render keepsake image."));
    image.src = src;
  });

  return image;
}

export async function rasterizeSvg(svgText: string, mimeType: RasterExportMimeType): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("Download unavailable");
  }

  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    const width = image.naturalWidth || 1200;
    const height = image.naturalHeight || 1500;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas unavailable");
    }

    if (mimeType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }

    context.drawImage(image, 0, 0, width, height);

    if (mimeType === "image/gif") {
      const imageData = context.getImageData(0, 0, width, height);
      const bytes = encodeGifFrame(imageData.data, width, height);
      const payload = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(payload).set(bytes);
      return new Blob([payload], { type: "image/gif" });
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, mimeType === "image/jpeg" ? 0.94 : undefined);
    });

    if (!blob) {
      throw new Error("Unable to export keepsake image.");
    }

    return blob;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function encodePdfText(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function concatPdfChunks(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const buffer = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  return buffer;
}

function buildPdfFromJpegBytes(jpegBytes: Uint8Array, sourceWidth: number, sourceHeight: number): Blob {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const fitScale = Math.min((pageWidth - margin * 2) / sourceWidth, (pageHeight - margin * 2) / sourceHeight);
  const drawWidth = sourceWidth * fitScale;
  const drawHeight = sourceHeight * fitScale;
  const offsetX = (pageWidth - drawWidth) / 2;
  const offsetY = (pageHeight - drawHeight) / 2;
  const contents = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${offsetX.toFixed(2)} ${offsetY.toFixed(2)} cm\n/Im0 Do\nQ\n`;

  const objectOffsets: number[] = [0];
  const chunks: Uint8Array[] = [];
  const pushChunk = (chunk: Uint8Array) => {
    chunks.push(chunk);
  };

  pushChunk(encodePdfText("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"));
  let offset = chunks[0].length;

  const pushObject = (objectId: number, objectData: Uint8Array) => {
    objectOffsets[objectId] = offset;
    pushChunk(objectData);
    offset += objectData.length;
  };

  pushObject(1, encodePdfText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"));
  pushObject(2, encodePdfText("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"));
  pushObject(
    3,
    encodePdfText(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    ),
  );

  const imageHead = encodePdfText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${sourceWidth} /Height ${sourceHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  const imageTail = encodePdfText("\nendstream\nendobj\n");
  pushObject(4, concatPdfChunks([imageHead, jpegBytes, imageTail]));

  const contentBytes = encodePdfText(contents);
  pushObject(
    5,
    encodePdfText(`5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${contents}endstream\nendobj\n`),
  );

  const xrefOffset = offset;
  const xrefLines: string[] = ["xref", "0 6", "0000000000 65535 f "];
  for (let objectId = 1; objectId <= 5; objectId += 1) {
    xrefLines.push(`${objectOffsets[objectId].toString().padStart(10, "0")} 00000 n `);
  }
  xrefLines.push("trailer");
  xrefLines.push("<< /Size 6 /Root 1 0 R >>");
  xrefLines.push("startxref");
  xrefLines.push(String(xrefOffset));
  xrefLines.push("%%EOF");

  pushChunk(encodePdfText(`${xrefLines.join("\n")}\n`));
  const payload = concatPdfChunks(chunks);
  const arrayBuffer = new ArrayBuffer(payload.byteLength);
  new Uint8Array(arrayBuffer).set(payload);
  return new Blob([arrayBuffer], { type: "application/pdf" });
}

export async function renderPdfFromSvg(svgText: string): Promise<Blob> {
  const jpegBlob = await rasterizeSvg(svgText, "image/jpeg");
  const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  return buildPdfFromJpegBytes(jpegBytes, 1200, 1500);
}
