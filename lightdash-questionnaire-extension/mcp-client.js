// Lightdash MCP Client — StreamableHTTP transport
// Connects to Lightdash's /api/v1/mcp endpoint using JSON-RPC 2.0

const LightdashMCP = (function () {
  "use strict";

  let _sessionId = null;
  let _requestId = 0;
  let _initialized = false;
  let _tools = [];

  function getBaseUrl() {
    // Derive from current page (we're running on *.lightdash.cloud)
    return window.location.origin;
  }

  function getMcpUrl() {
    return `${getBaseUrl()}/api/v1/mcp`;
  }

  function nextId() {
    return ++_requestId;
  }

  // ── Core transport: POST JSON-RPC to MCP endpoint ──────────
  async function sendRequest(method, params) {
    const body = {
      jsonrpc: "2.0",
      id: nextId(),
      method: method,
      params: params || {},
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };

    // Include session ID if we have one (from Mcp-Session-Id header)
    if (_sessionId) {
      headers["Mcp-Session-Id"] = _sessionId;
    }

    const response = await fetch(getMcpUrl(), {
      method: "POST",
      headers: headers,
      credentials: "include", // send cookies for auth
      body: JSON.stringify(body),
    });

    // Capture session ID from response headers
    const sessionHeader = response.headers.get("Mcp-Session-Id");
    if (sessionHeader) {
      _sessionId = sessionHeader;
    }

    // Check for HTTP-level errors first
    if (!response.ok && response.status !== 200 && response.status !== 202) {
      let errorText;
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          throw new McpError(errorJson.error.code, errorJson.error.message, errorJson.error.data);
        }
        errorText = JSON.stringify(errorJson);
      } catch (e) {
        if (e instanceof McpError) throw e;
        try { errorText = await response.text(); } catch (_) { errorText = response.statusText; }
      }
      throw new McpError(response.status, `HTTP ${response.status}: ${errorText}`);
    }

    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("text/event-stream")) {
      // SSE streaming response — collect all events
      return await readSSEResponse(response);
    } else {
      // Regular JSON response
      const json = await response.json();
      if (json.error) {
        throw new McpError(json.error.code, json.error.message, json.error.data);
      }
      return json.result;
    }
  }

  // ── SSE streaming reader ───────────────────────────────────
  async function readSSEResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let lastResult = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // keep incomplete last line

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.result) {
                lastResult = parsed.result;
              }
              if (parsed.error) {
                throw new McpError(
                  parsed.error.code,
                  parsed.error.message,
                  parsed.error.data
                );
              }
            } catch (e) {
              if (e instanceof McpError) throw e;
              // ignore parse errors on partial data
            }
          }
        }
      }
    }

    return lastResult;
  }

  // ── SSE streaming reader with callback ─────────────────────
  async function sendRequestStreaming(method, params, onChunk) {
    const body = {
      jsonrpc: "2.0",
      id: nextId(),
      method: method,
      params: params || {},
    };

    const headers = {
      "Content-Type": "application/json",
      Accept: "text/event-stream, application/json",
    };

    if (_sessionId) {
      headers["Mcp-Session-Id"] = _sessionId;
    }

    const response = await fetch(getMcpUrl(), {
      method: "POST",
      headers: headers,
      credentials: "include",
      body: JSON.stringify(body),
    });

    const sessionHeader = response.headers.get("Mcp-Session-Id");
    if (sessionHeader) {
      _sessionId = sessionHeader;
    }

    const contentType = response.headers.get("Content-Type") || "";

    if (contentType.includes("text/event-stream")) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data) {
              try {
                const parsed = JSON.parse(data);
                if (parsed.result) {
                  lastResult = parsed.result;
                  if (onChunk) onChunk(parsed.result);
                }
                if (parsed.error) {
                  throw new McpError(
                    parsed.error.code,
                    parsed.error.message,
                    parsed.error.data
                  );
                }
              } catch (e) {
                if (e instanceof McpError) throw e;
              }
            }
          }
        }
      }
      return lastResult;
    } else {
      const json = await response.json();
      if (json.error) {
        throw new McpError(json.error.code, json.error.message, json.error.data);
      }
      if (onChunk) onChunk(json.result);
      return json.result;
    }
  }

  // ── Error class ────────────────────────────────────────────
  class McpError extends Error {
    constructor(code, message, data) {
      super(message);
      this.code = code;
      this.data = data;
    }
  }

  // ── Public API ─────────────────────────────────────────────

  async function initialize() {
    if (_initialized) return;

    const result = await sendRequest("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: {
        name: "JustWatch Licensing Advisor",
        version: "1.0.0",
      },
    });

    _initialized = true;

    // Send initialized notification (no id = notification, 406 is expected)
    try {
      await fetch(getMcpUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ..._sessionId ? { "Mcp-Session-Id": _sessionId } : {},
        },
        credentials: "include",
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }),
      });
    } catch (_) {
      // Notification responses (including 406) are expected and safe to ignore
    }

    return result;
  }

  async function listTools() {
    await initialize();
    const result = await sendRequest("tools/list", {});
    _tools = result.tools || [];
    return _tools;
  }

  async function callTool(toolName, args, onChunk) {
    await initialize();
    const params = {
      name: toolName,
      arguments: args || {},
    };

    if (onChunk) {
      return await sendRequestStreaming("tools/call", params, onChunk);
    }
    return await sendRequest("tools/call", params);
  }

  async function listResources() {
    await initialize();
    return await sendRequest("resources/list", {});
  }

  async function readResource(uri) {
    await initialize();
    return await sendRequest("resources/read", { uri: uri });
  }

  // ── Convenience: discover tools ─────────────────────────────
  async function discoverTools() {
    if (_tools.length === 0) {
      await listTools();
    }
    return _tools;
  }

  // ── Run a metric query via MCP ─────────────────────────────
  // Calls Lightdash's run_metric_query tool with structured params
  async function runMetricQuery(title, description, queryConfig, onChunk) {
    await discoverTools();

    const args = {
      title: title,
      description: description,
      queryConfig: queryConfig,
    };

    return await callTool("run_metric_query", args, onChunk);
  }

  // ── Generic tool call by name ──────────────────────────────
  async function callToolByName(toolName, args, onChunk) {
    await discoverTools();
    return await callTool(toolName, args, onChunk);
  }

  function isInitialized() {
    return _initialized;
  }

  function getTools() {
    return _tools;
  }

  function reset() {
    _sessionId = null;
    _requestId = 0;
    _initialized = false;
    _tools = [];
  }

  return {
    initialize,
    listTools,
    callTool,
    callToolByName,
    listResources,
    readResource,
    runMetricQuery,
    discoverTools,
    isInitialized,
    getTools,
    reset,
    McpError,
  };
})();
