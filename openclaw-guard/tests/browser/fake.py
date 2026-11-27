import sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
mode = sys.argv[1]
class H(BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get("content-length", 0)); self.rfile.read(n)
        if mode == "hang": time.sleep(60)
        body = {"empty": b"{}", "garbage": b"<html>not json", "wrongtype": b'{"risky":"no"}'}[mode]
        self.send_response(200); self.send_header("content-length", str(len(body))); self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass
ThreadingHTTPServer(("127.0.0.1", 18998), H).serve_forever()
