// Synthetic "model": scripted. Not an AI. Logs every request it receives (proof of what reached the model).
import http from "node:http";
import fs from "node:fs";
const LOG = process.env.MOCK_LOG || "/downloads/oc-lab/mock-requests.jsonl";
let n = 0;
const textOf = (c) => typeof c === "string" ? c : Array.isArray(c) ? c.map((x) => x.text ?? "").join("") : "";
http.createServer((req, res) => {
  let body = "";
  req.on("data", (d) => body += d);
  req.on("end", () => {
    if (req.url.endsWith("/models")) { res.setHeader("content-type","application/json"); return res.end(JSON.stringify({ data: [{ id: "mock-1", object: "model" }] })); }
    let j = {}; try { j = JSON.parse(body); } catch {}
    const msgs = j.messages ?? [];
    const last = msgs[msgs.length - 1] ?? {};
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    const userText = textOf(lastUser?.content);
    const toolNames = (j.tools ?? []).map((t) => t.function?.name ?? t.name);
    fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), n: ++n, lastRole: last.role, userSnippet: userText.slice(-160), tools: toolNames }) + "\n");
    let delta, finish;
    if (last.role === "tool") {
      delta = { role: "assistant", content: "MOCK: tool result was: " + textOf(last.content).slice(0, 200) }; finish = "stop";
    } else {
      const allUser = msgs.filter((x)=>x.role==="user").map((x)=>textOf(x.content)).join("\n"); const m = allUser.match(/DO:(\{[^\n]*\})/);
      if (m) {
        let d; try { d = JSON.parse(m[1]); } catch {}
        if (d?.tool) {
          delta = { role: "assistant", content: null, tool_calls: [{ index: 0, id: "call_" + n, type: "function", function: { name: d.tool, arguments: JSON.stringify(d.args ?? {}) } }] };
          finish = "tool_calls";
        }
      }
      if (!delta) { delta = { role: "assistant", content: "MOCK: hello, no action requested." }; finish = "stop"; }
    }
    if (j.stream) {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
      const send = (o) => res.write("data: " + JSON.stringify(o) + "\n\n");
      const base = { id: "chatcmpl-" + n, object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000), model: "mock-1" };
      send({ ...base, choices: [{ index: 0, delta, finish_reason: null }] });
      send({ ...base, choices: [{ index: 0, delta: {}, finish_reason: finish }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } });
      res.write("data: [DONE]\n\n"); res.end();
    } else {
      res.setHeader("content-type", "application/json");
      const { index, ...msg } = delta; if (msg.tool_calls) msg.tool_calls = msg.tool_calls.map(({ index, ...t }) => t);
      res.end(JSON.stringify({ id: "chatcmpl-" + n, object: "chat.completion", created: 0, model: "mock-1", choices: [{ index: 0, message: msg, finish_reason: finish }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }));
    }
  });
}).listen(18999, "127.0.0.1", () => console.log("mock listening"));
