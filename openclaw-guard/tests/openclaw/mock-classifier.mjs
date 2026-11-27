// Synthetic classifier stand-in (NOT a model): flags text containing "PAYROLL-LEAK" as risky; mode via env.
import http from "node:http";
const mode = process.env.MODE || "ok";
http.createServer((req, res) => { let b=""; req.on("data",(d)=>b+=d); req.on("end",()=>{ const t=JSON.parse(b||"{}").text||""; const go=()=>{res.setHeader("content-type","application/json"); res.end(JSON.stringify({risky:/PAYROLL-LEAK/.test(t)}));}; if(mode==="slow") setTimeout(go,6000); else go(); }); }).listen(18998,"127.0.0.1");
