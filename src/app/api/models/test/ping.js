import { getApiKeys } from "@/lib/localDb";
import { UPDATER_CONFIG } from "@/shared/constants/config";
import { getConsistentMachineId } from "@/shared/utils/machineId";

const CLI_TOKEN_SALT = "9r-cli-auth";
const IS_VERCEL = !!(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_REGION);

function createSilentWavFile() {
  const sampleRate = 16000;
  const channels = 1;
  const bitsPerSample = 16;
  const durationMs = 250;
  const sampleCount = Math.max(1, Math.floor((sampleRate * durationMs) / 1000));
  const dataSize = sampleCount * channels * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeAscii = (offset, value) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * (bitsPerSample / 8), true);
  view.setUint16(32, channels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(36, "data");
  view.setUint32(40, dataSize, true);

  return new Blob([buffer], { type: "audio/wav" });
}

async function getInternalHeaders() {
  let apiKey = null;
  try {
    const keys = await getApiKeys();
    apiKey = keys.find((k) => k.isActive !== false)?.key || null;
  } catch {}

  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  headers["x-9r-cli-token"] = await getConsistentMachineId(CLI_TOKEN_SALT);
  return headers;
}

function getDefaultBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.VERCEL) {
    const url = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (url) return url.startsWith("http") ? url : `https://${url}`;
  }
  return `http://127.0.0.1:${process.env.PORT || UPDATER_CONFIG.appPort}`;
}

/**
 * On Vercel Hobby, serverless functions cannot fetch their own deployment URL.
 * Instead of self-fetching, call the chat handler directly in-process.
 */
async function callChatDirectly(model, maxTokens = 1024) {
  const { handleChat } = await import("@/sse/handlers/chat.js");
  const { initTranslators } = await import("open-sse/translator/index.js");
  await initTranslators();

  const body = {
    model,
    max_tokens: maxTokens,
    stream: false,
    messages: [{ role: "user", content: "hi" }],
  };

  const fakeRequest = new Request("http://localhost/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const response = await handleChat(fakeRequest);
  return response;
}

export async function pingModelByKind(model, kind, baseUrl = getDefaultBaseUrl()) {
  const headers = await getInternalHeaders();
  const start = Date.now();

  // On Vercel, use direct in-process call instead of self-fetch
  const useDirectCall = IS_VERCEL && kind === "llm";

  if (kind === "embedding") {
    if (useDirectCall) {
      // Embeddings can't be tested directly, skip with friendly message
      return { ok: false, latencyMs: 0, error: "Self-test not available on Vercel (embedding)", status: 0 };
    }
    const res = await fetch(`${baseUrl}/api/v1/embeddings`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, input: "test" }),
      signal: AbortSignal.timeout(15000),
    });
    const latencyMs = Date.now() - start;
    const rawText = await res.text().catch(() => "");
    let parsed = null;
    try { parsed = rawText ? JSON.parse(rawText) : null; } catch {}

    if (!res.ok) {
      const detail = parsed?.error?.message || parsed?.error || rawText;
      return { ok: false, latencyMs, error: `HTTP ${res.status}${detail ? `: ${String(detail).slice(0, 240)}` : ""}`, status: res.status };
    }
    const hasEmbedding = Array.isArray(parsed?.data) && parsed.data.length > 0 && Array.isArray(parsed.data[0]?.embedding);
    if (!hasEmbedding) {
      return { ok: false, latencyMs, status: res.status, error: "Provider returned no embedding data" };
    }
    return { ok: true, latencyMs, error: null, status: res.status };
  }

  if (kind === "image") {
    if (useDirectCall) {
      return { ok: false, latencyMs: 0, error: "Self-test not available on Vercel (image)", status: 0 };
    }
    const res = await fetch(`${baseUrl}/api/v1/images/generations`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, prompt: "test" }),
      signal: AbortSignal.timeout(15000),
    });
    const latencyMs = Date.now() - start;
    const rawText = await res.text().catch(() => "");
    let parsed = null;
    try { parsed = rawText ? JSON.parse(rawText) : null; } catch {}

    if (!res.ok) {
      const detail = parsed?.error?.message || parsed?.msg || parsed?.message || parsed?.error || rawText;
      return { ok: false, latencyMs, error: `HTTP ${res.status}${detail ? `: ${String(detail).slice(0, 240)}` : ""}`, status: res.status };
    }

    const hasImages = Array.isArray(parsed?.data) && parsed.data.length > 0;
    if (!hasImages) {
      return { ok: false, latencyMs, status: res.status, error: "Provider returned no image data for this model" };
    }
    return { ok: true, latencyMs, error: null, status: res.status };
  }

  if (kind === "stt") {
    if (useDirectCall) {
      return { ok: false, latencyMs: 0, error: "Self-test not available on Vercel (stt)", status: 0 };
    }
    const form = new FormData();
    const sampleAudio = createSilentWavFile();
    form.append("file", sampleAudio, "test.wav");
    form.append("model", model);

    const res = await fetch(`${baseUrl}/api/v1/audio/transcriptions`, {
      method: "POST",
      headers: Object.fromEntries(Object.entries(headers).filter(([key]) => key.toLowerCase() !== "content-type")),
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    const latencyMs = Date.now() - start;
    const rawText = await res.text().catch(() => "");
    let parsed = null;
    try { parsed = rawText ? JSON.parse(rawText) : null; } catch {}

    if (!res.ok) {
      const detail = parsed?.error?.message || parsed?.msg || parsed?.message || parsed?.error || rawText;
      return { ok: false, latencyMs, error: `HTTP ${res.status}${detail ? `: ${String(detail).slice(0, 240)}` : ""}`, status: res.status };
    }

    const text = typeof parsed?.text === "string" ? parsed.text : "";
    if (!text.trim()) {
      return { ok: false, latencyMs, status: res.status, error: "Provider returned no transcription text for this model" };
    }
    return { ok: true, latencyMs, error: null, status: res.status };
  }

  // LLM chat — on Vercel use direct in-process call
  if (useDirectCall) {
    try {
      const response = await callChatDirectly(model);
      const latencyMs = Date.now() - start;

      // Response is a NextResponse — read body
      const text = await response.text().catch(() => "");
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch {}

      if (response.status !== 200) {
        const detail = parsed?.error?.message || parsed?.error || text;
        return { ok: false, latencyMs, status: response.status, error: `HTTP ${response.status}${detail ? `: ${String(detail).slice(0, 240)}` : ""}` };
      }

      if (parsed?.error) {
        const providerError = parsed?.error?.message || parsed?.error || "Provider returned an error";
        return { ok: false, latencyMs, status: response.status, error: String(providerError).slice(0, 240) };
      }

      const hasChoices = Array.isArray(parsed?.choices) && parsed.choices.length > 0;
      const firstChoice = parsed?.choices?.[0] || {};
      const hasReasoning = firstChoice.message?.reasoning || firstChoice.message?.reasoning_content || firstChoice.message?.thinking || firstChoice.message?.thinking_content;
      const contentEmpty = !String(firstChoice.message?.content || "").trim();

      if (hasChoices && firstChoice.finish_reason === "length" && contentEmpty && hasReasoning) {
        return { ok: true, latencyMs, error: null, status: 200, note: "reasoning-only response (length-limited)" };
      }

      if (!hasChoices) {
        return { ok: false, latencyMs, status: 200, error: "Provider returned no completion choices for this model" };
      }

      return { ok: true, latencyMs, error: null, status: 200 };
    } catch (err) {
      return { ok: false, latencyMs: Date.now() - start, status: 500, error: `Direct call failed: ${String(err.message).slice(0, 240)}` };
    }
  }

  // Non-Vercel: use HTTP self-fetch
  const res = await fetch(`${baseUrl}/api/v1/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      stream: false,
      messages: [{ role: "user", content: "hi" }],
    }),
    signal: AbortSignal.timeout(15000),
  });
  const latencyMs = Date.now() - start;

  const rawText = await res.text().catch(() => "");
  let parsed = null;
  try { parsed = rawText ? JSON.parse(rawText) : null; } catch {}

  if (!res.ok) {
    const detail = parsed?.error?.message || parsed?.msg || parsed?.message || parsed?.error || rawText;
    return { ok: false, latencyMs, error: `HTTP ${res.status}${detail ? `: ${String(detail).slice(0, 240)}` : ""}`, status: res.status };
  }

  const providerStatus = parsed?.status;
  const providerMsg = parsed?.msg || parsed?.message;
  const hasProviderErrorStatus = providerStatus !== undefined
    && providerStatus !== null
    && String(providerStatus) !== "200"
    && String(providerStatus) !== "0";
  if (hasProviderErrorStatus && providerMsg) {
    return {
      ok: false,
      latencyMs,
      status: res.status,
      error: `Provider status ${providerStatus}: ${String(providerMsg).slice(0, 240)}`,
    };
  }

  if (parsed?.error) {
    const providerError = parsed?.error?.message || parsed?.error || "Provider returned an error";
    return {
      ok: false,
      latencyMs,
      status: res.status,
      error: String(providerError).slice(0, 240),
    };
  }

  const hasChoices = Array.isArray(parsed?.choices) && parsed.choices.length > 0;

  const firstChoice = parsed?.choices?.[0] || {};
  const hasReasoning =
    firstChoice.message?.reasoning ||
    firstChoice.message?.reasoning_content ||
    firstChoice.message?.thinking ||
    firstChoice.message?.thinking_content;
  const contentEmpty = !String(firstChoice.message?.content || "").trim();
  if (hasChoices && firstChoice.finish_reason === "length" && contentEmpty && hasReasoning) {
    return { ok: true, latencyMs, error: null, status: res.status, note: "reasoning-only response (length-limited)" };
  }

  if (!hasChoices) {
    return {
      ok: false,
      latencyMs,
      status: res.status,
      error: "Provider returned no completion choices for this model",
    };
  }

  return { ok: true, latencyMs, error: null, status: res.status };
}
