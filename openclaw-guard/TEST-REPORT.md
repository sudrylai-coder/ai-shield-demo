# AI Shield Guard 0.1.0 - test evidence (02:10 IST, 27.11.2026)
Runtime: OpenClaw 2026.11.10 (6ea542f), Node 24.22.3, Linux, isolated dirs, no install on any user device, no paid service.
Model: local MOCK server written for the test (scripted, not an AI). OpenClaw hook dispatch and tool execution are real.
Artifact sha256: tar.gz 5dacf427...1d32 ; zip 4747d708...f723

Fresh install (empty HOME, unzip, bash install.sh): config backup created, plugin loaded; uninstall.sh removed it (plugins list shows 0 matches).
| Test | Result |
| card 4111... in message | blocked, model server received 0 requests for it |
| Israeli ID with valid check digit | blocked (earlier run) |
| injection phrase | blocked (earlier run) |
| read inside workspace | guard allowed (OpenClaw's own sandbox root in this lab rejected the abs path; lab artifact) |
| read via symlink pointing outside | guard denied |
| write new file via symlinked dir pointing outside | guard denied, no file created |
| write inside workspace | denied (not on allowlist in this version) |
| exec | denied (approval path disabled) |
| ls / process / unlisted tools | denied by default |
Earlier non-interactive run: approval-required tools failed closed in OpenClaw (canary file intact).
NOT verified: approve-then-run with a real human approver; Windows/macOS; real model behavior; plugin-disabled-by-admin; hook crash behavior.

Hook crash test (plugin copy that throws): before_agent_run throws -> message blocked, 0 model requests (fail closed). before_tool_call throws -> "Tool call blocked because before_tool_call hook failed", write and exec did not run, canary intact (fail closed).
Update 02:12: symlink/ancestor checks and approval-off defaults are in the published build (sha256 5dacf427...1d32 tar.gz).
