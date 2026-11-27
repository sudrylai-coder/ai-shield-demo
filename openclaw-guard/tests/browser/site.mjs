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
console.log("title:", await ev("document.title"), "| url:", await ev("location.href"));
const info = await ev(`(()=>{const c=document.querySelector('#prompt-textarea,[contenteditable=true],textarea');return c?c.tagName+'#'+c.id+' ce='+c.isContentEditable:'NO COMPOSER'})()`);
console.log("composer:", info);
if (process.env.NEWCHAT && info !== "NO COMPOSER") { console.log("new chat click:", await ev(`(()=>{const a=[...document.querySelectorAll("a,button")].find(x=>/new chat/i.test(x.innerText||""));if(a){a.click();return "clicked"}return "none"})()`)); await wait(2500); }
if (info !== "NO COMPOSER" && process.argv[4] === "type") {
  await ev(`document.querySelector('#prompt-textarea,[contenteditable=true],textarea').focus()`);
  await p("Input.insertText", { text: process.env.TXT || "test card 4111 1111 1111 1111" }); await wait(500);
  if (process.env.HOW === "button") { console.log("button click:", await ev(`(()=>{const b=[...document.querySelectorAll("button")].find(x=>/send|submit|שלח/i.test((x.getAttribute("aria-label")||"")+" "+x.innerText+" "+(x.type||"")));if(b){b.click();return (b.getAttribute("aria-label")||b.innerText||b.type)}return "NO BUTTON"})()`)); } else {
  await p("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
  await p("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); }
  { const t0 = Date.now(); const needle = (process.env.TXT || "test card 4111 1111 1111 1111").slice(0,20); while (Date.now() - t0 < 40000) { await wait(250); const done = await ev(`document.body.innerText.includes(${JSON.stringify(needle)}) || document.documentElement.hasAttribute("data-ai-shield-blocked")`); if (done) break; } console.log("elapsed ms Enter->outcome:", Date.now() - t0); await wait(800); }
  if (process.env.TWICE) { console.log("flag after 1st:", await ev("document.documentElement.getAttribute('data-ai-shield-blocked')"), "| bubble:", await ev(`document.body.innerText.includes(${JSON.stringify((process.env.TXT||"").slice(0,20))})`)); await p("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" }); await p("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); await wait(3000); console.log("(second Enter sent)"); }
  console.log("page accepted message into chat (text visible in conversation, outside composer):", await ev(`document.body.innerText.includes(${JSON.stringify((process.env.TXT || "test card 4111 1111 1111 1111").slice(0,20))})`));
  console.log("banner:", await ev("(document.getElementById('ai-shield-banner')||{}).textContent"));
  console.log("status attr:", await ev("document.documentElement.getAttribute('data-ai-shield-status')"), "| badge:", await ev("(document.getElementById('ai-shield-badge')||{}).textContent"));
  console.log("shield flag:", await ev("document.documentElement.getAttribute('data-ai-shield-blocked')"));
  console.log("composer text now:", JSON.stringify((await ev(`document.querySelector('#prompt-textarea,[contenteditable=true],textarea').innerText||''`))).slice(0,80));
  console.log("non-GET requests attempted (all failed by the harness):", JSON.stringify(blockedPosts.filter((x)=>!/improving\.duckduckgo\.com/.test(x))), "telemetry POSTs:" + blockedPosts.filter((x)=>/improving\.duckduckgo/.test(x)).length + " total non-GET:", blockedPosts.length);
  const shot = await p("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(process.argv[5] || "/tmp/site.png", Buffer.from(shot.result.data, "base64"));
}
clearInterval(pump); chrome.kill(); process.exit(0);
