# AI Shield: handoff, test report, inventory (27.11.2026, built for AI Venture Night)
Status: working prototypes, NOT a finished product. Everything below says what was actually run. Nothing here is "protected on download", universal, signed, native, or Windows/macOS-supported.

## 1. What is real and what is simulated
| Component | Status | Where |
|---|---|---|
| Browser demo "AI Shield" (permissions gate UI, audit log in browser) | SIMULATED. No real agent or model behind it. Its log is a browser-local hash chain, not signed or tamper-proof. | ../demo/ |
| GitHub gate proof (real branch/permission boundary on a throwaway repo) | REAL, separate from the products below | https://github.com/sudrylai-coder/ai-shield-gate-proof |
| OpenClaw guard 0.2.0 (input gate + tool gate, rules-only by default) | REAL, tested on OpenClaw 2026.11.10, Linux lab, with a scripted SYNTHETIC model (not a real AI). Hooks are not a sandbox. | download/ai-shield-guard-0.2.0.zip |
| Optional local model for OpenClaw (Qwen3Guard-Gen-0.6B) | REAL model, optional, OFF by default, separate download (about 1.5 GB), measured on a 1-CPU lab only | semantic/ inside the OpenClaw zip |
| Browser prototype 0.2.0 (duck.ai only; rules, optional required local model) | REAL in headless Chrome 157 with synthetic text; DOM-level evidence only; load-unpacked only | download/ai-shield-browser-duck-0.2.0.zip |
| Browser prototype 0.1.0 | Superseded, kept so old links work | download/ai-shield-browser-duck-0.1.0.zip |
| Hosted/external model | NOT connected. No text is sent to any provider. | none |
| Native Windows installer, desktop companion working in any app, any other website | NOT built | see section 6 |

## 2. Downloads (sha256 in download/SHA256SUMS)
- ai-shield-guard-0.2.0.zip dd3c5cc17b317e377f8634aa07602cdd0e43d44eb2f1b09f682a4353195f5595 (and .tar.gz 8b5a9d1d93441a411dc9ef32ded9ac5f4cfbe6b1c9d5c629f047ad9e76e0cbad)
- ai-shield-browser-duck-0.2.0.zip 8468bb44aec553793f7b077b22f5d84f07142f743e404ddedbe26dcec1af1bfa
- 0.1.0 files of both products are kept (superseded).

## 3. Shortest verified setup
OpenClaw guard (Linux; verified by a fresh install from the live zip into empty state):
1. Have OpenClaw 2026.11.x installed (Node 24.16+). We did not install it on any user device.
2. unzip ai-shield-guard-0.2.0.zip into an empty folder (it has no wrapper folder); cd into it; bash install.sh (backs up the config, installs the plugin, enables it, sets allowlist to read only).
3. Restart the OpenClaw gateway. To remove: bash uninstall.sh (removes plugin and its config stub, keeps other config, does not auto-restore the backup).
4. Default is rules-only. The local model is a separate, explicit step (semantic/setup-semantic.sh --yes, then start and enable scripts); never automatic.
Browser prototype (duck.ai only):
1. unzip ai-shield-browser-duck-0.2.0.zip; chrome://extensions; Developer mode; Load unpacked; pick the folder. Works at once in rules-only mode (green badge).
2. Optional model mode: set up the model/venv, run helper/shield-helper.py, copy ~/.ai-shield/helper-token into config.js (token field), set mode to "rules+model", reload the extension. If the helper is unavailable, sending is blocked.
Not "one click": steps are manual.

## 4. Test evidence (all synthetic text; nothing sent to any external provider)
OpenClaw guard (real OpenClaw hooks, scripted model): card (Luhn), Israeli ID, secrets, classification labels, long base64/hex, injection phrases EN/HE blocked with 0 model requests; symlink and outside-workspace reads/writes denied; only "read" allowlisted; write/edit/exec denied (approval path off); hook crash fails closed; optional classifier fails closed when required and down/slow; install/uninstall verified. Not verified: approve-then-run with a real human approver, plugin disabled by admin, real model behavior in the agent loop beyond the samples below. See TEST-REPORT.md.
Local model sample (Qwen3Guard-Gen-0.6B, Apache-2.0, sha256 4f3ce47e...5c0f): 8 attack-style and 12 benign prompts; Hebrew salary-to-gmail and a paraphrased jailbreak blocked; 1 of 12 benign prompts was a false positive. About 2 s per message alone, about 30 s end to end through OpenClaw on a 1-CPU lab. Small sample, not a benchmark.
Browser prototype 0.2.0 (headless Chrome 157, CDP loadUnpacked, harness failed every non-GET request):
- Rules mode: card blocked (Enter, Send button), clean passes, same after New chat; control without the extension accepts the same text.
- rules+model mode: model block by Enter and Ask button; safe verdict then press again; clearance bound to exact text, composer and URL, single use, 60 s, rules rerun at send; edit-to-risk, edit-to-other-text, URL change, rapid duplicate Enter all handled; helper down, wrong token, empty JSON, non-JSON, wrong type, hung helper (25.7 s) all block.
- Helper: no Origin 403, web Origin 403, no/wrong token 401, spoofed Host 403, preflight 403, no config endpoint, 5000 B body 413, concurrent checks 429+200, slow client closed at 5 s, no prompt files written.
- Latency, 1-CPU lab, Enter to verdict: about 5 to 10 s. Not a promise elsewhere.
- Test note: in one earlier run a replayed click on duck.ai's Ask button counted as accepting duck.ai's terms in a throwaway profile; the harness failed the resulting requests and nothing was sent. That code path was removed.
Tests are in tests/ (browser and openclaw scripts). The browser tests need Chrome 157, node, and for model mode the helper plus model.

## 5. Known gaps (precise)
- Browser: DOM-level interception only; page scripts, pasted files, other browsers, direct network and disabling the extension bypass it. duck.ai terms card meant no network-level control for clean text. Only duck.ai tested. Not tested: other sites, Windows/macOS, uninstall mid-session, multi-tab.
- Helper: the Origin header is caller-set and proves nothing; the token file is readable by any process running as the same user, so same-user malware is not resisted. Linux-tested only.
- OpenClaw guard: hooks are not a sandbox; other tools or plugins are outside its view; write/edit/exec are blocked outright, so agents lose those; Linux only; real approval flow not verified.
- Models: one small model, small sample, one false positive in 12 benign prompts, no Hebrew benchmark. No evidence that larger local models are better here (untested).
- No hosted model qualified (Hebrew not documented for Azure Prompt Shields or Google Model Armor detectors). Pilot candidate if ever authorized: Azure Prompt Shields free tier on synthetic Hebrew only; no account created.
- Market/business claims: none validated.

## 6. Native Windows feasibility (recommendation, not achieved)
Documented facts: OpenClaw docs describe a native Windows Hub app as the recommended Windows desktop path, plus PowerShell and WSL2 paths (https://docs.openclaw.ai/platforms/windows/). Chrome extensions load on Windows through the same Chrome mechanisms; managed PCs can force-install via ExtensionInstallForcelist group policy/registry (https://support.google.com/chrome/a/answer/7532015?hl=en). Chrome Web Store publishing needs a one-time registration fee, listed as $5 (https://developer.chrome.com/docs/webstore/register ; amount per https://docs.extensy.dev/publishing/developer-account). Windows installers outside the Microsoft Store are subject to SmartScreen reputation and code signing; Store-distributed MSIX is signed by Microsoft (https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation, https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options). PyTorch installs on Windows with pip (https://docs.pytorch.org/get-started/locally/).
Recommended path (inference, none of it done or tested on Windows): (1) free: a PowerShell install.ps1 for the OpenClaw guard and a Windows test of the extension in rules-only mode, run on a real Windows test machine, which we do not have; (2) the model helper on Windows is the heavy part (Python + torch, 1.5 GB); keep it optional; (3) one-click extension install needs the Web Store ($5, needs your approval) or enterprise policy; (4) a signed native installer needs a signing path that may cost money; not recommended before steps 1 to 3 are verified. A companion that works inside any desktop app is a different, larger build (OS-level hooks and permissions) and is not started.

## 7. Presentation path (one path, in this order)
1. Problem and idea (existing presentation page: ../presentation/).
2. Simulated demo: ../demo/ (say it is simulated).
3. Real boundary proof: the GitHub gate proof repo.
4. Real adapter: OpenClaw guard 0.2.0 page and TEST-REPORT.md (say: Linux, synthetic model, rules-only default).
5. Real browser prototype: ../openclaw-guard/#browser2 (say: duck.ai only, manual install, DOM-level).
6. Honest close: gaps (section 5) and Windows plan (section 6).

## 8. Source and test inventory (sha256, first 16 hex)
| Artifact | File | Bytes | sha256 |
|---|---|---|---|
| OpenClaw guard 0.2.0 plugin | index.js | 2944 | 14cd39af3e9977bb |
| OpenClaw guard 0.2.0 plugin | openclaw.plugin.json | 652 | 0f30369a6622cbdf |
| OpenClaw guard 0.2.0 plugin | package.json | 234 | 8593ada7f2d37eea |
| OpenClaw guard 0.2.0 plugin | policy-core.js | 6913 | e335a63cf3a3c859 |
| Browser prototype 0.2.0 | README.md | 3206 | e22ce09d55a2fdea |
| Browser prototype 0.2.0 | background.js | 902 | c86415a04e5a76ec |
| Browser prototype 0.2.0 | config.js | 204 | cd583bd18d395076 |
| Browser prototype 0.2.0 | content.js | 6329 | aba928fd096b2024 |
| Browser prototype 0.2.0 | helper/shield-helper.py | 4029 | da1ba632d657b184 |
| Browser prototype 0.2.0 | inspect.js | 1605 | ba7db9889db51e9b |
| Browser prototype 0.2.0 | manifest.json | 525 | 4e07804ae66dbd2d |
| Optional semantic scripts (in OpenClaw zip) | enable-semantic.sh | 683 | 37613b9b549efa38 |
| Optional semantic scripts (in OpenClaw zip) | qwen-server.py | 1436 | 5c5688fe97df6405 |
| Optional semantic scripts (in OpenClaw zip) | setup-semantic.sh | 1315 | b02a823b4e8e90b1 |
Test scripts: tests/browser/{site.mjs,seq.mjs,fake.py,chat.html,v3.sh,v4.sh,v5.sh}, tests/openclaw/{mock-model.mjs,mock-classifier.mjs,run-tests2.sh}.
Rules source: Yossi's rule list (maatefet/IMPLEMENTATION.md at a6a3bfa) read only as a rule list; his files were not modified. Yossi's later commit 6911671 touched only the Claude connection UI, not rules.
