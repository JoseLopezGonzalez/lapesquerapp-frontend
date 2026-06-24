declare module 'file-saver' {
  export function saveAs(
    data: Blob | File | string,
    filename?: string,
    options?: { autoBom?: boolean }
  ): void;
}

declare module '@undecaf/zbar-wasm' {
  interface ZBarPoint {
    x: number;
    y: number;
  }
  interface ZBarSymbol {
    typeName: string;
    decode(): string;
    points: ZBarPoint[];
  }
  export function scanImageData(imageData: ImageData): Promise<ZBarSymbol[]>;
}
