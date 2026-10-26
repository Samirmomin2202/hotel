function getRagApiStatus() {
    const endpointConfigured = Boolean(process.env.RAG_API_URL?.trim());
    const authenticationConfigured = Boolean(process.env.RAG_API_KEY?.trim());
    return {
        connected: endpointConfigured && authenticationConfigured,
        endpointConfigured,
        authenticationConfigured,
        queryField: process.env.RAG_API_QUERY_FIELD || "message"
    };
}

function resolveChatEndpoint(configuredUrl) {
    const endpoint = String(configuredUrl || "").trim().replace(/\/+$/, "");
    if (/\/api\/chat$/i.test(endpoint)) return endpoint;
    if (/\/api$/i.test(endpoint)) return `${endpoint}/chat`;
    return `${endpoint}/api/chat`;
}

function extractAnswer(payload) {
    const candidates = [
        payload?.answer,
        payload?.data?.answer,
        payload?.response,
        payload?.data?.response,
        payload?.output,
        payload?.data?.output,
        payload?.generated_text,
        payload?.text
    ];
    return candidates.find((candidate) => typeof candidate === "string" && candidate.trim())?.trim() || "";
}

function extractSource(payload) {
    const source = payload?.source ?? payload?.data?.source ?? payload?.sources ?? payload?.data?.sources;
    if (typeof source === "string") return source;
    if (Array.isArray(source)) {
        return source.map((item) => typeof item === "string" ? item : item?.title || item?.name || item?.url)
            .filter(Boolean).join(", ") || null;
    }
    return source?.title || source?.name || source?.url || null;
}

async function askRagApi(message, conversationId = null, memoryScope = null) {
    const endpoint = process.env.RAG_API_URL;
    if (!endpoint) return null;

    const queryField = process.env.RAG_API_QUERY_FIELD || "message";
    const authHeader = process.env.RAG_API_AUTH_HEADER || "Authorization";
    const authScheme = process.env.RAG_API_AUTH_SCHEME === undefined ? "Bearer" : process.env.RAG_API_AUTH_SCHEME;
    const timeoutMs = Math.max(1000, Math.min(Number(process.env.RAG_API_TIMEOUT_MS) || 15000, 60000));
    const headers = { "Content-Type": "application/json", Accept: "application/json" };

    if (process.env.RAG_API_KEY) {
        headers[authHeader] = authScheme
            ? `${authScheme} ${process.env.RAG_API_KEY}`
            : process.env.RAG_API_KEY;
    }

    let response;
    try {
        response = await fetch(resolveChatEndpoint(endpoint), {
            method: "POST",
            headers,
            body: JSON.stringify({ [queryField]: message, conversation_id: conversationId || null, memory_scope: memoryScope || null }),
            signal: AbortSignal.timeout(timeoutMs)
        });
    } catch (err) {
        const timedOut = err?.name === "TimeoutError" || err?.name === "AbortError";
        const error = new Error(timedOut ? "The RAG service timed out." : "The RAG service could not be reached.");
        error.cause = err;
        error.status = timedOut ? 504 : 503;
        error.ragApi = true;
        throw error;
    }

    let payload;
    try {
        payload = await response.json();
    } catch {
        payload = null;
    }
    if (!response.ok) {
        // Preserve only the status for server-side diagnosis; never return upstream
        // response bodies, which can include provider details or internal output.
        const error = new Error("The RAG service returned an error.");
        error.status = response.status;
        error.ragApi = true;
        throw error;
    }

    const answer = extractAnswer(payload);
    if (!answer) {
        const error = new Error("The RAG service response did not contain an answer field.");
        error.status = 502;
        error.ragApi = true;
        throw error;
    }
    return {
        answer,
        source: extractSource(payload),
        conversation_id: typeof payload?.conversation_id === "string" ? payload.conversation_id : null
    };
}

module.exports = { askRagApi, getRagApiStatus };
