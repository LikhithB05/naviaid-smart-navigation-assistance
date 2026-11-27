import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import vm from 'node:vm';

const htmlPath = new URL('../index.html', import.meta.url);
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
assert.ok(scriptMatch, 'Must locate inline script in index.html');
// Strip trailing checkWatchMode() call at load or mock search empty
const scriptCode = scriptMatch[1];

function createHarness() {
  const elements = {};
  const getEl = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        innerText: '',
        innerHTML: '',
        style: {},
        width: 300,
        height: 240,
        getContext: () => ({
          clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
          fillText() {}, arc() {}, fill() {}, drawImage() {}, getImageData: () => ({ data: [], width: 1, height: 1 })
        }),
        captureStream: () => ({ getTracks: () => [] })
      };
    }
    return elements[id];
  };

  const spoken = [];
  const vibrated = [];
  const openedUrls = [];
  const motionListeners = [];
  const keyListeners = {};

  class MockPeer {
    constructor(id) { this.id = id || 'peer-mock'; this.handlers = {}; setTimeout(() => this.handlers.open?.(this.id), 0); }
    on(ev, fn) { this.handlers[ev] = fn; }
    destroy() {}
  }

  const sandbox = {
    console,
    Math,
    Date,
    String,
    Number,
    Array,
    encodeURIComponent,
    setTimeout: (fn, ms) => 0, // manual or non-blocking in unit test except check
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: () => {},
    URLSearchParams,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis: {
      speaking: false,
      cancel() {},
      speak(u) { spoken.push(u.text); },
      pause() {},
      resume() {}
    },
    Peer: MockPeer,
    DeviceMotionEvent: class {},
    document: {
      getElementById: getEl,
      createElement: (tag) => getEl('created_' + tag),
      addEventListener: (ev, fn) => { keyListeners[ev] = fn; },
      body: { innerHTML: '' }
    },
    navigator: {
      vibrate: (pat) => vibrated.push(pat),
      geolocation: {
        getCurrentPosition: (ok) => ok({ coords: { latitude: 12.94101, longitude: 77.56552 } })
      },
      mediaDevices: {
        getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] })
      }
    },
    window: null
  };
  sandbox.localStorage = { getItem: (k) => k === 'navaid_guardian_number' ? '15550100000' : null, setItem() {} };
  sandbox.window = {
    location: { href: 'https://example.test/index.html', search: '' },
    open: (url, target) => openedUrls.push({ url, target }),
    addEventListener: (ev, fn) => { if (ev === 'devicemotion') motionListeners.push(fn); },
    SpeechRecognition: class { start() {} stop() {} },
    _synthKeepAlive: null
  };
  sandbox.DeviceMotionEvent = sandbox.window.DeviceMotionEvent = function() {};

  vm.createContext(sandbox);
  vm.runInContext(scriptCode, sandbox);
  return { sandbox, elements, spoken, vibrated, openedUrls, motionListeners, getEl };
}

test('NaviAid Core Functional Verification Suite', async (t) => {
  await t.test('1. Schedule Array Generation (144 10-minute slots across 8 places)', () => {
    const { sandbox } = createHarness();
    assert.strictEqual(vm.runInContext('schedule.length', sandbox), 144);
    assert.strictEqual(vm.runInContext('schedule[0].time', sandbox), '00:00');
    assert.strictEqual(vm.runInContext('schedule[143].time', sandbox), '23:50');
    sandbox.getScheduleAtTime(12, 30);
    assert.ok(sandbox.document.getElementById('nextPlace').innerText.includes('12:30'));
  });

  await t.test('2. Standard QR Navigation Sequence (Entrance -> Reception -> Corridor A -> Junction -> Cardiology)', () => {
    const { sandbox, spoken, getEl } = createHarness();
    sandbox.handleQR('Entrance');
    assert.ok(spoken.at(-1).includes('Entrance detected'));
    assert.strictEqual(getEl('destination').style.display, 'block');

    sandbox.selectDest('cardiology');
    assert.strictEqual(getEl('navigation').style.display, 'block');
    assert.ok(spoken.at(-1).includes('reception'));

    sandbox.handleQR('Reception');
    assert.ok(getEl('instruction').innerText.includes('corridor A'));
    sandbox.handleQR('Corridor A');
    assert.ok(getEl('instruction').innerText.includes('junction'));
    sandbox.handleQR('Junction');
    assert.ok(getEl('instruction').innerText.includes('Cardiology is on your left'));
    sandbox.handleQR('Cardiology');
    assert.ok(getEl('instruction').innerText.includes('reached your destination'));
  });

  await t.test('3. Incorrect / Out-of-Order QR Handling & Dynamic Recalculation', () => {
    const { sandbox, spoken, getEl } = createHarness();
    sandbox.handleQR('Entrance');
    sandbox.selectDest('cardiology');
    // User skips reception/corridor a and scans Junction unexpectedly -> snaps step & recalculates
    sandbox.handleQR('Junction');
    assert.ok(spoken.at(-1).startsWith('Recalculating.'), `Expected Recalculating prompt, got: ${spoken.at(-1)}`);
    assert.ok(getEl('instruction').innerText.includes('Cardiology is on your left'));

    // Now scan OFF-ROUTE checkpoint ('Pharmacy') while destination is Cardiology -> computes viaJunction instruction
    sandbox.handleQR('Pharmacy');
    assert.ok(spoken.at(-1).startsWith('Wrong checkpoint.'), `Expected Wrong checkpoint prompt, got: ${spoken.at(-1)}`);
    assert.ok(getEl('instruction').innerText.startsWith('Wrong way.'), `Expected Wrong way UI text, got: ${getEl('instruction').innerText}`);
    assert.ok(getEl('instruction').innerText.includes('Walk five steps back to the junction Then Turn left and walk five steps'), 'Must construct viaJunction rerouting instruction');

    // Invalid QR payload silently ignored
    const prevInstr = getEl('instruction').innerText;
    sandbox.handleQR('UNKNOWN_RANDOM_QR_12345');
    assert.strictEqual(getEl('instruction').innerText, prevInstr);
  });

  await t.test('4. Multi-Destination Route Builder (Cardiology <-> Pharmacy via Junction)', () => {
    const { sandbox, spoken, getEl } = createHarness();
    sandbox.handleQR('Entrance');
    sandbox.selectDest('cardiology');
    sandbox.handleQR('Cardiology'); // complete -> currentLocation='cardiology'
    sandbox.startNewNavigation('pharmacy');
    assert.ok(spoken.at(-1).includes('Going to pharmacy from cardiology'));
    assert.ok(getEl('instruction').innerText.includes('junction'));
  });

  await t.test('5. Fall Detection Synthetic DeviceMotion (Normal motion vs >25 m/s^2 Spike)', () => {
    const { sandbox, motionListeners, openedUrls, spoken } = createHarness();
    sandbox.listenMotion();
    assert.strictEqual(motionListeners.length, 1);

    // Baseline sample & gentle walk delta (< 25)
    motionListeners[0]({ accelerationIncludingGravity: { x: 0, y: 9.8, z: 0 } });
    motionListeners[0]({ accelerationIncludingGravity: { x: 1.5, y: 10.2, z: 1.0 } });
    assert.strictEqual(openedUrls.length, 0, 'Normal walking must not trigger fall alert');

    // Sudden fall spike (delta = sqrt(20^2 + 15^2 + 15^2) > 25)
    motionListeners[0]({ accelerationIncludingGravity: { x: 21.5, y: 25.2, z: 16.0 } });
    assert.ok(spoken.some(s => s.includes('fall detected')));
    assert.strictEqual(openedUrls.length, 1);
    assert.ok(openedUrls[0].url.startsWith('https://wa.me/'));
    assert.ok(decodeURIComponent(openedUrls[0].url).includes('https://maps.google.com/?q=12.94101,77.56552'));

    // Second immediate spike blocked by fallCooldown
    motionListeners[0]({ accelerationIncludingGravity: { x: 0, y: 0, z: 0 } });
    assert.strictEqual(openedUrls.length, 1, 'Cooldown must prevent duplicate WhatsApp alerts');
  });

  await t.test('6. SOS activation, sharing choice and cancel', () => {
    const { sandbox, spoken, vibrated, getEl, openedUrls } = createHarness();
    let mediaRequests = 0;
    sandbox.navigator.mediaDevices.getUserMedia = async () => { mediaRequests++; };
    sandbox.handleQR('Entrance');
    sandbox.triggerSOS();
    assert.strictEqual(getEl('sosOverlay').style.display, 'flex');
    assert.ok(spoken.some(s => s.includes('Emergency activated')));
    assert.ok(vibrated.some(v => Array.isArray(v) && v.length === 5));
    assert.equal(mediaRequests, 0);
    assert.equal(openedUrls.length, 0);
    sandbox.dismissSOS();
    assert.strictEqual(getEl('sosOverlay').style.display, 'none');
    assert.ok(spoken.at(-1).includes('SOS cancelled'));
  });
  await t.test('7. Cancel discards late permissions and GPS callbacks', async () => {
    const { sandbox, openedUrls } = createHarness();
    let grantMedia, grantLocation, tracksStopped = 0;
    sandbox.navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { grantMedia = resolve; });
    sandbox.navigator.geolocation.getCurrentPosition = resolve => { grantLocation = resolve; };
    sandbox.triggerSOS();
    sandbox.shareSOSMedia();
    sandbox.prepareSOSMessage();
    await Promise.resolve();
    sandbox.dismissSOS();
    grantMedia({ getTracks: () => [{ stop() { tracksStopped++; } }] });
    grantLocation({ coords: { latitude: 0, longitude: 0 } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(tracksStopped, 1);
    assert.equal(openedUrls.length, 0);
  });
});
