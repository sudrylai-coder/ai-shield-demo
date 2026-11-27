#!/usr/bin/env bash
cd /downloads/oc-lab/ext
export PATH=/downloads/oc-lab/node_modules/.bin:$PATH
SRC=/downloads/oc-lab/ext/v2/ai-shield-browser-duck
setsid python3 -m http.server 8788 --bind 127.0.0.1 --directory /downloads/oc-lab/ext/test >/dev/null 2>&1 &
rm -rf /tmp/t3; mkdir -p /tmp/t3/model; cp -r $SRC/. /tmp/t3/model
echo "self.AI_SHIELD_CONFIG={mode:'rules+model',port:18998,token:'fake'};" > /tmp/t3/model/config.js
sed -i 's|https://duck.ai/\*|http://127.0.0.1:8788/*|' /tmp/t3/model/manifest.json
for m in $1; do
 setsid python3 test/fake.py $m >/dev/null 2>&1 & sleep 1
 rm -rf /tmp/chrome-site-prof; echo "### fake helper returns: $m"
 STEPS='[{"ins":"what is two plus two"},{"enter":1,"max":40000},{"snap":"result (required mode, must block, sent=[])"}]' timeout 100 node test/seq.mjs /tmp/t3/model http://127.0.0.1:8788/chat.html 2>&1 | grep -v '^title\|^load\|^composer\|^rm\|^insert'
 pkill -f "test/fake.py"; pkill -f chrome-site-prof; sleep 1
done
pkill -f "http.server 8788"
