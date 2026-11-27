# NaviAid Application Demonstration & Screenshot Evidence

This document describes the visual screenshots included in [`assets/screenshots/`](../assets/screenshots/) and how each state was captured.

## Screenshot Inventory & Capture Context

| Screenshot | File | Capture Source & Conditions |
|---|---|---|
| **Start & Guardian Setup** | [`start-screen.png`](../assets/screenshots/start-screen.png) | Local HTTP server (`index.html`), clean initial load prior to camera/mic permissions or saved contact input. |
| **Active Navigation & Mini-Map** | [`active-navigation.png`](../assets/screenshots/active-navigation.png) | Local HTTP server (`index.html`), headless Chromium mobile viewport (`430x900` @2x) using synthetic camera stream, `15550100000` test guardian input, `Entrance` scanned, `Cardiology` selected. |
| **Wrong-Checkpoint Rerouting** | [`wrong-checkpoint-reroute.png`](../assets/screenshots/wrong-checkpoint-reroute.png) | Same local session after invoking `handleQR('Pharmacy')` while navigating to `Cardiology`, showing `"Wrong way. Walk five steps to junction then eight steps through corridor A then six steps to reception"`. |
| **Destination Reached** | [`destination-reached.png`](../assets/screenshots/destination-reached.png) | Same local session after progressing through `Junction` to `Cardiology`, displaying `"You have reached your destination"` and completed route nodes on the mini-map `<canvas>`. |
| **SOS Emergency Modal** | [`sos-emergency-modal.png`](../assets/screenshots/sos-emergency-modal.png) | Same local session after invoking `triggerSOS()`, showing the consented sharing options (`Start live camera and microphone`, `Open WhatsApp draft`, `Cancel SOS`). |
| **WhatsApp SOS Alert Draft (Device)** | [`whatsapp-sos-alert.jpg`](../assets/screenshots/whatsapp-sos-alert.jpg) | Real-device WhatsApp SOS alert screenshot provided by the developer (`pharmacy` checkpoint, Google Maps `?q=` link, `9:55 pm`), with EXIF metadata stripped and GPS coordinates blurred for privacy. |
| **Guardian Watch View** | [`guardian-watch-mode.png`](../assets/screenshots/guardian-watch-mode.png) | Local HTTP server (`index.html?watch=navaid-demo-preview`), showing the `?watch=` PeerJS remote viewer UI and offline peer status prompt when no active sender session is broadcasting. |
| **Crowd Navigator Companion** | [`crowd-navigator-vision.png`](../assets/screenshots/crowd-navigator-vision.png) | Local HTTP server (`crowd-navigator.html`), showing the standalone TensorFlow.js / COCO-SSD crowd-avoidance companion interface (`ACTIVATE GUIDANCE`, `READY`). |

## Privacy & Sanitization Notes

- No personal phone numbers, contact names, or device identifiers appear in any screenshot.
- Synthetic test input (`15550100000`) was used for local UI captures.
- All images were re-encoded to strip EXIF/metadata before inclusion.
