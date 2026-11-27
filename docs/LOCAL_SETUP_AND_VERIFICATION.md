# Local Setup, Browser Compatibility & Verification

## 1. Secure Context Requirement (`HTTPS` or `localhost`)
Browser security blocks `getUserMedia()`, `SpeechRecognition`, `navigator.geolocation`, and `DeviceMotionEvent` on plain `http://` LAN IPs or `file://` URLs. Always serve locally via `localhost` (`npx serve .` or `python -m http.server 8080 --bind 127.0.0.1`) or deploy over `HTTPS`.

## 2. Platform Compatibility Matrix (Based on Code Inspection & API Specs)

| Capability | Desktop Chrome / Edge | Android Chrome | iOS Safari |
|---|---|---|---|
| Camera QR Scan (`jsQR` + Canvas) | Supported (`localhost` / `HTTPS`) | Supported (`facingMode: "environment"`) | Supported (`playsinline` + `HTTPS`) |
| `SpeechRecognition` | Supported (`webkitSpeechRecognition`) | Supported (Chrome Android) | Limited / inconsistent (`SpeechRecognition` often unavailable) |
| `SpeechSynthesis` | Supported | Supported (uses `10 s` keepAlive fix) | Requires initial user tap gesture |
| `DeviceMotionEvent` Fall Detection | Hardware absent on most desktops | Supported without extra prompt | Requires `DeviceMotionEvent.requestPermission()` tap grant |
| PeerJS P2P Guardian Stream | Supported (requires public internet / STUN) | Supported (uses 2s track unmute fallback) | Supported (`playsinline muted` autoplay + unmute tap) |
| WhatsApp `wa.me` Alert | Opens WhatsApp Web / Desktop tab | Opens WhatsApp Android with draft | Opens WhatsApp iOS with draft |

## 3. Isolated Node Logic Verification (`tests/naviaid.test.mjs`)
Run `npm test` (`node --test tests/*.test.mjs`) to verify core state logic in an isolated Node `vm` harness (`8/8` tests passing):
1. `144`-slot 24-hour schedule generation & `12:30` lookup.
2. Sequential QR routing (`entrance` -> `reception` -> `corridor a` -> `junction` -> `cardiology`).
3. On-route skipped step snapping (`"Recalculating..."`) + off-route `viaJunction` recovery (`"Wrong checkpoint..."`) + unknown QR ignore.
4. Branch-to-branch multi-destination routing (`cardiology` -> `pharmacy`).
5. Synthetic `DeviceMotionEvent` normal walk vs. `delta > 25` fall spike + `10 s` cooldown + WhatsApp/Maps URL encoding.
6. SOS trigger, `?watch=` overlay state, and `dismissSOS()` cleanup.
