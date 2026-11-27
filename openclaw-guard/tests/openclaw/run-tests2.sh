#!/bin/bash
cd /downloads/oc-lab
export PATH=/downloads/oc-lab/node_modules/.bin:$PATH HOME=/downloads/oc-lab/home OPENCLAW_STATE_DIR=/downloads/oc-lab/home/state OPENCLAW_CONFIG_PATH=/downloads/oc-lab/home/openclaw.json
rm -f mock-requests.jsonl audit.jsonl; rm -rf ws; mkdir -p ws
echo "CANARY-ORIGINAL" > ws/canary.txt; echo "outside-secret-XYZ" > /tmp/outside.txt; ln -s /tmp/outside.txt ws/link.txt
node mock-model.mjs > mock.out 2>&1 & MP=$!
sleep 1
run() { echo "=== $1"; shift; timeout 100 openclaw agent exec "$@" 2>&1 | grep -v 'agent-db\|agent-command\|log file append' | tail -4 | cut -c1-260; }
run U1-read-abs 'DO:{"tool":"read","args":{"path":"/downloads/oc-lab/ws/canary.txt"}}'
run U2-symlink-escape 'DO:{"tool":"read","args":{"path":"/downloads/oc-lab/ws/link.txt"}}'
run U3-dotdot 'DO:{"tool":"read","args":{"path":"/downloads/oc-lab/ws/../../../tmp/outside.txt"}}'
run U4-exec-obfuscated 'DO:{"tool":"exec","args":{"command":"r\"\"m /downloads/oc-lab/ws/canary.txt"}}'
run U5-exec-benign 'DO:{"tool":"exec","args":{"command":"echo hi"}}'
run U6-ls 'DO:{"tool":"ls","args":{"path":"/downloads/oc-lab/ws"}}'
run U7-process 'DO:{"tool":"process","args":{"action":"list"}}'
echo "--- canary: $(cat ws/canary.txt)"
echo "--- audit"; cut -c1-200 audit.jsonl
kill $MP
