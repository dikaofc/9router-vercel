// Helpers for OpenAI Responses API streaming termination + event framing
import { FORMATS } from "../translator/formats.js";
import { formatSSE } from "./streamHelpers.js";

// Responses API events that signal the stream has reached a terminal state
const OPENAI_RESPONSES_TERMINAL_EVENTS = new Set([
  "response.completed",
  "response.done",
  "response.failed",
  "error"
]);

export function getOpenAIResponsesEventName(eventName, chunk) {
  if (eventName) return eventName;
  if (chunk && typeof chunk.type === "string") return chunk.type;
  return null;
}

export function isOpenAIResponsesTerminalEvent(eventName, chunk) {
  const type = getOpenAIResponsesEventName(eventName, chunk);
  if (OPENAI_RESPONSES_TERMINAL_EVENTS.has(type)) return true;
  const status = chunk?.response?.status;
  return status === "completed" || status === "failed";
}

const sharedEncoder = new TextEncoder();

// Terminal finish for aborted OpenAI-family SSE streams so AI-SDK clients
// don't throw "stream ended without finish_reason" and retry from zero.
// Upstream can disconnect/stall mid-stream (pi.dev EOFs after reasoning
// deltas, Vercel freezes idle fns, network resets) — the transform flush()
// then never runs, so no finish chunk is emitted. This guarantees the
// client always receives a terminal finish_reason + [DONE].
export function buildOpenAIFinishTerminalBytes() {
  const chunk = {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "unknown",
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }]
  };
  return sharedEncoder.encode(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`);
}

// Claude-format terminal for aborted streams (Claude Code / agents).
export function buildClaudeMessageStopTerminalBytes() {
  return sharedEncoder.encode(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);
}

// Encoded response.failed + [DONE] payload for aborted/stalled Responses passthrough streams
export function buildAbortedResponsesTerminalBytes() {
  return sharedEncoder.encode(`${formatIncompleteOpenAIResponsesStreamFailure()}data: [DONE]\n\n`);
}

// Synthesize a response.failed event for streams that close without a terminal event
export function formatIncompleteOpenAIResponsesStreamFailure() {
  return formatSSE({
    event: "response.failed",
    data: {
      type: "response.failed",
      response: {
        id: `resp_${Date.now()}`,
        status: "failed",
        error: {
          type: "stream_error",
          code: "stream_disconnected",
          message: "stream closed before response.completed"
        }
      }
    }
  }, FORMATS.OPENAI_RESPONSES);
}
