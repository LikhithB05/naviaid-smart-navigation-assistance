# QR Checkpoint Demonstration Guide

This directory contains the **6 verified QR checkpoint markers** decoded via `cv2.QRCodeDetector()` (with filenames normalized for cross-platform compatibility):

| File | Decoded Text | Topology Role | Canvas Coordinates |
|---|---|---|---|
| `entrance.jpeg` | `Entrance` | Mandatory origin node | `(25, 215)` |
| `reception.jpeg` | `Reception` | Spine step 2 | `(80, 195)` |
| `corridor-a.jpeg` | `Corridor A` | Spine step 3 | `(140, 155)` |
| `junction.jpeg` | `Junction` | Spine-to-branch hub | `(200, 110)` |
| `cardiology.jpeg` | `Cardiology` | North destination branch | `(275, 65)` |
| `pharmacy.jpeg` | `Pharmacy` | South destination branch | `(275, 185)` |

## Quick Walkthrough (Printed or Second-Screen Demo)

1. Serve `index.html` over `http://localhost` (or `https://`) and click **Start Navigation**.
2. Show **`entrance.jpeg`** -> app speaks *"Entrance detected. Please say your destination."* Select **Cardiology** (or speak `"Cardiology"`).
3. **Normal Progression:** Scan `reception.jpeg` -> `corridor-a.jpeg` -> `junction.jpeg` -> `cardiology.jpeg` to observe Canvas updates and step-count speech guidance.
4. **Skipped-Checkpoint Recalculation Test:** After choosing `Cardiology` at `entrance.jpeg`, immediately show `junction.jpeg`. `handleQR()` snaps `currentStep` forward and speaks *"Recalculating. Turn left and walk five steps. Cardiology is on your left."*
5. **Wrong-Branch Recovery Test:** While routed to `Cardiology` (`currentStep` at `junction`), show `pharmacy.jpeg`. `handleQR()` invokes the `viaJunction` fallback: *"Wrong checkpoint. Walk five steps back to the junction Then Turn left and walk five steps..."*
6. **Clean-State Reset Note:** After any test run completes (`navigationComplete = true`), use a voice command `"go to ..."` to start a fresh route or reload the page.
