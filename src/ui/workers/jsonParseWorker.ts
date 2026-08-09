type ParseRequest = {
  bytes: ArrayBuffer;
};

type ParseResponse =
  | { ok: true; value: unknown }
  | { message: string; ok: false };

import { compactLibrarySearchTransport } from "../lib/librarySearchTransport";

self.addEventListener("message", (event: MessageEvent<ParseRequest>) => {
  try {
    const text = new TextDecoder().decode(event.data.bytes);
    const response: ParseResponse = {
      ok: true,
      value: compactLibrarySearchTransport(JSON.parse(text)),
    };
    self.postMessage(response);
  } catch (error) {
    const response: ParseResponse = {
      message: error instanceof Error ? error.message : String(error),
      ok: false,
    };
    self.postMessage(response);
  }
});

export {};
