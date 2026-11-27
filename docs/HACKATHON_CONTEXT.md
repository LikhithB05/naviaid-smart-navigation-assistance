# Hackathon Context & Version History Reconciliation

## 1. Hackathon Presentation (`HACKATHON.pptx`) vs. Actual Implementation

| Aspect | Presentation Slides (`SuperNova`, `March 13, 2026`, `Protocol BMSCE`) | Implemented Code (`index.html` & `crowd-navigator.html`) |
|---|---|---|
| **Indoor Positioning** | Proposed simulated BLE beacons or QR checkpoints | Implemented optical **QR checkpoints** (`jsQR` + `6` marker JPEGs) |
| **Routing Algorithm** | Proposed **A*** search on JSON graph | Implemented **6-node Spine-and-Branch `buildPath()`** + `17` step strings + `handleQR()` wrong-checkpoint recalculation |
| **Obstacle Detection** | Proposed TensorFlow Lite / YOLO + audio/haptic alerts | Implemented **TensorFlow.js COCO-SSD (`mobilenet_v2`)** 3-zone spatial counter in companion `crowd-navigator.html` |
| **Voice Interaction** | Voice commands + Text-to-Speech | Implemented `SpeechRecognition` (`5` alts, `8 s` watchdog) + `SpeechSynthesis` (`10 s` keepAlive) + `144`-slot schedule |
| **Emergency & Guardian** | Focus on independent navigation | Implemented **3 SOS triggers**, **`DeviceMotion` fall detection** (`delta > 25`), GPS Maps links, WhatsApp `wa.me` drafts, and **PeerJS WebRTC** `?watch=` streaming |

## 2. Source Artifact Timeline Inside Original Folder
1. **Early Draft (`New Text Document.txt`):** Markdown-wrapped prototype using L1 fall threshold (`|x|+|y|+|z| > 45`), no wrong-way `viaJunction` rerouting, no Guardian live panel.
2. **Netlify Snapshot (`NavAid Indoor Navigation.html`):** Earlier deployed build adding on-route step snapping, volume/3-finger SOS, Euclidean fall detection (`> 25`), and local camera preview—without PeerJS watch links or `viaJunction` recovery.
3. **Final Version (`index.html` + `index_crowd_final.html`):** Definitive latest implementation uniting PeerJS WebRTC Guardian P2P streaming, `viaJunction` branch wrong-way recovery, SpeechSynthesis keepAlive, and standalone COCO-SSD crowd avoidance.
