import { spawn } from "node:child_process";
import fs from "node:fs";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn("google-chrome", ["--headless=new","--no-sandbox","--disable-gpu","--remote-debugging-pipe","--enable-unsafe-extension-debugging","--user-data-dir=/tmp/chrome-site-prof","--window-size=1280,900","about:blank"], { stdio: ["ignore","ignore","ignore","pipe","pipe"] });
let id = 0; const pend = new Map(); let buf = ""; const events = [];
chrome.stdio[4].on("data", (d) => { buf += d.toString(); let i; while ((i = buf.indexOf("\0")) >= 0) { const m = buf.slice(0, i); buf = buf.slice(i + 1); try { const j = JSON.parse(m); if (j.id && pend.has(j.id)) pend.get(j.id)(j); else events.push(j); } catch {} } });
const send = (method, params = {}, sess) => new Promise((r) => { const i = ++id; pend.set(i, r); const msg = { id: i, method, params }; if (sess) msg.sessionId = sess; chrome.stdio[3].write(JSON.stringify(msg) + "\0"); });
await wait(2500);
const EXT = process.argv[2];
if (EXT !== "none") console.log("load:", JSON.stringify((await send("Extensions.loadUnpacked", { path: EXT })).result));
const tg = await send("Target.getTargets");
const sess = (await send("Target.attachToTarget", { targetId: tg.result.targetInfos.find((t) => t.type === "page").targetId, flatten: true })).result.sessionId;
const p = (m, x) => send(m, x, sess);
const ev = async (e) => (await p("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await p("Page.enable");
// Safety net: block every non-GET request to the site so nothing can really be submitted.
await p("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
const blockedPosts = [];
const pump = setInterval(async () => {
  while (events.length) { const e = events.shift(); if (e.method === "Fetch.requestPaused") { const r = e.params.request; if (r.method !== "GET" && r.method !== "OPTIONS" && r.method !== "HEAD") { blockedPosts.push(r.method + " " + r.url.split("?")[0]); await send("Fetch.failRequest", { requestId: e.params.requestId, errorReason: "BlockedByClient" }, sess); } else await send("Fetch.continueRequest", { requestId: e.params.requestId }, sess); } }
}, 50);
await p("Page.navigate", { url: process.argv[3] }); await wait(9000);

await wait(3000);
const SEL = `document.querySelector("#t")`;
const steps = JSON.parse(process.env.STEPS);
const snap = async (label) => console.log("  [" + label + "] flag=" + (await ev("document.documentElement.getAttribute('data-ai-shield-blocked')")) + " | status=" + (await ev("document.documentElement.getAttribute('data-ai-shield-status')")) + " | composer=" + JSON.stringify(((await ev(`(${SEL}).innerText||''`))||"").slice(0,60)) + " | sent=" + JSON.stringify(await ev("window.__sent")) + " | bubbles(count of 'BUBBLEMARK')=" + (await ev(`(document.body.innerText.match(/BUBBLEMARK/g)||[]).length`)) + " | banner=" + JSON.stringify(((await ev("(document.getElementById('ai-shield-banner')||{}).textContent"))||"").slice(0,70)));
for (const st of steps) {
  if (st.ins !== undefined) { await ev(`(${SEL}).focus()`); await p("Input.insertText", { text: st.ins }); await wait(300); console.log("insert", JSON.stringify(st.ins).slice(0,70)); }
  else if (st.clear) { await ev(`(()=>{const e=${SEL};e.focus();document.execCommand("selectAll");document.execCommand("delete");})()`); await wait(300); console.log("clear composer"); }
  else if (st.reset) { await ev(`document.documentElement.removeAttribute("data-ai-shield-blocked");const b=document.getElementById("ai-shield-banner");if(b)b.remove();`); }
  else if (st.enter) { const t0=Date.now(); await p("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" }); await p("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); while (Date.now()-t0 < (st.max||12000)) { await wait(250); if (await ev(`document.documentElement.hasAttribute("data-ai-shield-blocked") || (window.__sent||[]).length>0`)) break; } await wait(600); console.log("enter -> outcome ms", Date.now()-t0); }
  else if (st.newchat) { console.log("new chat:", await ev(`(()=>{const a=[...document.querySelectorAll("a,button")].find(x=>/new chat/i.test(x.innerText||""));if(a){a.click();return "clicked"}return "none"})()`)); await wait(2500); }
  else if (st.js) console.log("js:", await ev(st.js));
  else if (st.shot) { const sh = await p("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(st.shot, Buffer.from(sh.result.data, "base64")); }
  else if (st.snap) await snap(st.snap);
  else if (st.wait) await wait(st.wait);
  else if (st.domtoken) console.log("  token in DOM/URL?", await ev(`(document.documentElement.outerHTML+location.href).includes(${JSON.stringify(process.env.TKN||"zzzzzz")})`));
}
console.log("non-GET (filtered):", JSON.stringify(blockedPosts.filter((x)=>!/improving\.duckduckgo/.test(x))));
clearInterval(pump); chrome.kill(); process.exit(0);
