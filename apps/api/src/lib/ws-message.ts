export type WsMessageData =
  | string
  | ArrayBuffer
  | SharedArrayBuffer
  | ArrayBufferView
  | Blob;

export const decodeWsMessage = async (data: WsMessageData): Promise<string> => {
  if (typeof data === "string") return data;

  if (data instanceof Blob) {
    const buffer = await data.arrayBuffer();
    return new TextDecoder().decode(buffer);
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(data));
  }

  if (typeof SharedArrayBuffer !== "undefined" && data instanceof SharedArrayBuffer) {
    return new TextDecoder().decode(new Uint8Array(data));
  }

  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(
      new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
    );
  }

  return "";
};
