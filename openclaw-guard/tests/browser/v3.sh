#!/usr/bin/env bash
cd /downloads/oc-lab/ext
export PATH=/downloads/oc-lab/node_modules/.bin:$PATH AI_SHIELD_HOME=/tmp/shh AI_SHIELD_MODEL_DIR=/tmp/f2/ai/qwen3guard-0.6b
SRC=${SRC:-/downloads/oc-lab/ext/v2/ai-shield-browser-duck}
setsid /tmp/f2/ai/venv/bin/python $SRC/helper/shield-helper.py >/tmp/helper.out 2>&1 &
for i in $(seq 60); do grep -q "helper on" /tmp/helper.out && break; sleep 1; done
export TKN=$(cat /tmp/shh/helper-token)
rm -rf /tmp/t2; mkdir -p /tmp/t2/model; cp -r $SRC/. /tmp/t2/model
echo "self.AI_SHIELD_CONFIG={mode:'rules+model',port:18998,token:'$TKN'};" > /tmp/t2/model/config.js
curl -s -o /dev/null -H "Origin: chrome-extension://abc" -H "X-Shield-Token: $TKN" -d '{"text":"warm"}' http://127.0.0.1:18998/check
U="https://duck.ai/chat?ia=chat"
rm -rf /tmp/chrome-site-prof
echo "### $1"; STEPS="$2" timeout 110 node test/seq.mjs /tmp/t2/model "$U" 2>&1 | grep -v '^title\|^load\|^composer\|^rm'
pkill -f shield-helper; pkill -f chrome-site-prof
