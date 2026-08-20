// Shared SSE primitives (no imports → safe for executors + stream.js)
export const SSE_DONE = "data: [DONE]\n\n";

export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive"
};

// Variant for web-cookie executors behind nginx (disable proxy buffering)
export const SSE_HEADERS_NO_BUFFER = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  "X-Accel-Buffering": "no"
};

// Variant for client-facing SSE responses (adds permissive CORS).
// X-Accel-Buffering: no tells Vercel's edge/proxy layer to stream chunks
// through immediately instead of buffering — without it a long agent turn can
// appear frozen, then dump all content at once (or the connection is cut).
export const SSE_HEADERS_CORS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "X-Accel-Buffering": "no",
  "Connection": "keep-alive",
  "Access-Control-Allow-Origin": "*"
};
