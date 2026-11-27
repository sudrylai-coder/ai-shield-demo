#!/usr/bin/env bash
cd /downloads/oc-lab/ext
export PATH=/downloads/oc-lab/node_modules/.bin:$PATH AI_SHIELD_HOME=/tmp/shh AI_SHIELD_MODEL_DIR=/tmp/f2/ai/qwen3guard-0.6b
SRC=/downloads/oc-lab/ext/v2/ai-shield-browser-duck
setsid python3 -m http.server 8788 --bind 127.0.0.1 --directory /downloads/oc-lab/ext/test >/dev/null 2>&1 &
setsid /tmp/f2/ai/venv/bin/python $SRC/helper/shield-helper.py >/tmp/helper.out 2>&1 &
for i in $(seq 60); do grep -q "helper on" /tmp/helper.out && break; sleep 1; done
export TKN=$(cat /tmp/shh/helper-token)
rm -rf /tmp/t3; mkdir -p /tmp/t3/model; cp -r $SRC/. /tmp/t3/model
echo "self.AI_SHIELD_CONFIG={mode:'rules+model',port:18998,token:'$TKN'};" > /tmp/t3/model/config.js
sed -i 's|https://duck.ai/\*|http://127.0.0.1:8788/*|' /tmp/t3/model/manifest.json
curl -s -o /dev/null -H "Origin: chrome-extension://abc" -H "X-Shield-Token: $TKN" -d '{"text":"warm"}' http://127.0.0.1:18998/check
while [ $# -gt 0 ]; do rm -rf /tmp/chrome-site-prof; echo "### $1"; STEPS="$2" timeout 100 node test/seq.mjs /tmp/t3/model http://127.0.0.1:8788/chat.html 2>&1 | grep -v '^title\|^load\|^composer\|^rm'; shift 2; done
pkill -f shield-helper; pkill -f chrome-site-prof; pkill -f "http.server 8788"
