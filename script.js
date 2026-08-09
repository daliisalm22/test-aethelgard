import * as THREE from 'three';

const STORAGE_KEY_STARS = 'aethelgard.memoryStars.v2';
const STORAGE_KEY_PREFS = 'aethelgard.prefs.v2';

const state = {
    selectedStar: null,
    holdProgress: 0,
    selectedCategory: 'all',
    starGlowColor: '#dad6fa',
    motionActive: false,
    audio: {
        musicOn: true,
        sfxOn: true,
        volume: 0.7,
    },
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

function loadPrefs() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFS);
        if (raw) {
            const p = JSON.parse(raw);
            if (p.starGlowColor) state.starGlowColor = p.starGlowColor;
            if (p.audio) Object.assign(state.audio, p.audio);
        }
    } catch (e) {}
}

function savePrefs() {
    try {
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({
            starGlowColor: state.starGlowColor,
            audio: state.audio,
        }));
    } catch (e) {}
}

const seedStars = [
    { id: 'seed-1',  name: 'Vesper',     message: 'A quiet night under the old observatory.', category: 'featured',  color: '#c4bffa', image: 'img/large_star.png' },
    { id: 'seed-2',  name: 'Astraea',    message: 'First lines of code that actually compiled.', category: 'featured', color: '#dad6fa', image: 'img/medium_star.png' },
    { id: 'seed-3',  name: 'Lumen',      message: 'Looking for constellations that did not exist.', category: 'zodiac',   color: '#b2afd0', image: 'img/small_star.png' },
    { id: 'seed-4',  name: 'Nyx',        message: 'We promised to meet again when the comets return.', category: 'mythology', color: '#797a96', image: 'img/large_star.png' },
    { id: 'seed-5',  name: 'Eos',        message: 'Whispering secrets into the digital void.', category: 'mythology', color: '#5d5777', image: 'img/medium_star.png' },
    { id: 'seed-6',  name: 'Orion',      message: 'The universe is vast, but I found your orbit.', category: 'bright',   color: '#9b8fc9', image: 'img/small_star.png' },
    { id: 'seed-7',  name: 'Lyra',       message: 'Every song we never finished still hums up here.', category: 'zodiac',   color: '#c4bffa', image: 'img/large_star.png' },
    { id: 'seed-8',  name: 'Andromeda',  message: 'A galaxy of what-ifs and almosts.', category: 'zodiac',    color: '#dad6fa', image: 'img/medium_star.png' },
    { id: 'seed-9',  name: 'Polaris',    message: 'Steady when everything else drifted.', category: 'bright',    color: '#e8e4ff', image: 'img/small_star.png' },
    { id: 'seed-10', name: 'Sirius',     message: 'The brightest goodbye I ever knew.', category: 'bright',     color: '#f0edff', image: 'img/large_star.png' },
    { id: 'seed-11', name: 'Pegasus',    message: 'Wings of hope stitched from stardust.', category: 'mythology', color: '#b2afd0', image: 'img/medium_star.png' },
    { id: 'seed-12', name: 'Cassiopeia', message: 'A throne of light for the lonely queens.', category: 'featured',  color: '#dad6fa', image: 'img/small_star.png' },
];

function loadStars() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_STARS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const deletedIds = new Set(parsed.filter(s => s._deleted).map(s => s.id));
                const userStars = parsed.filter(s => !s._deleted && !seedStars.some(d => d.id === s.id));
                const seeds = seedStars.filter(s => !deletedIds.has(s.id));
                return [...userStars, ...seeds];
            }
        }
    } catch (e) {}
    return [...seedStars];
}

let stars = loadStars();

function persistStars() {
    try {
        localStorage.setItem(STORAGE_KEY_STARS, JSON.stringify(stars));
    } catch (e) {}
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030816);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
document.getElementById('canvas-container').appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    resizeParticles();
});

const numStars = 1500;
const bubbleRadius = 1500;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(numStars * 3);

for (let i = 0; i < numStars; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = bubbleRadius * Math.cbrt(Math.random());
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = r * Math.cos(phi);
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0xf1edee, size: 6, sizeAttenuation: true, transparent: true, opacity: 0.8 });
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

const textureLoader = new THREE.TextureLoader();
const textureCache = {};

function getTexture(path) {
    if (!textureCache[path]) {
        textureCache[path] = textureLoader.load(path);
    }
    return textureCache[path];
}

const memoryStars = [];

function createMemoryStarNode(starData) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = (bubbleRadius * 0.8) * Math.cbrt(Math.random());

    const texPath = starData.image || 'img/medium_star.png';
    const texture = getTexture(texPath);

    const material = new THREE.SpriteMaterial({
        map: texture,
        color: new THREE.Color(starData.color || state.starGlowColor),
        transparent: true,
        depthWrite: false,
    });

    const memoryStar = new THREE.Sprite(material);
    memoryStar.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );

    const baseScale = 30 + Math.random() * 40;
    memoryStar.scale.set(baseScale, baseScale, baseScale);

    memoryStar.userData.starId = starData.id;
    memoryStar.userData.baseColor = starData.color || state.starGlowColor;
    memoryStar.userData.baseScale = baseScale;
    memoryStar.userData.pulsePhase = Math.random() * Math.PI * 2;

    scene.add(memoryStar);
    memoryStars.push(memoryStar);
    return memoryStar;
}

function getStarMeshById(id) {
    return memoryStars.find(m => m.userData.starId === id) || null;
}

function applyGlowColor() {
    const glow = new THREE.Color(state.starGlowColor);
    memoryStars.forEach(m => {
        m.material.color.set(glow);
        m.userData.baseColor = state.starGlowColor;
    });
    document.documentElement.style.setProperty('--glow-color', state.starGlowColor);
    const rgb = glow;
    document.documentElement.style.setProperty('--glow-color-rgb', `${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}`);
    const swatch = document.getElementById('glow-swatch');
    if (swatch) swatch.style.background = state.starGlowColor;
}

function animateStarRemove(id, onDone) {
    const mesh = getStarMeshById(id);
    if (!mesh) { if (onDone) onDone(); return; }
    const start = performance.now();
    const dur = 500;
    function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const s = 1 - easeOutBack(t);
        mesh.scale.set(Math.max(0.01, s), Math.max(0.01, s), Math.max(0.01, s));
        if (t < 1) {
            requestAnimationFrame(step);
        } else {
            scene.remove(mesh);
            const idx = memoryStars.indexOf(mesh);
            if (idx >= 0) memoryStars.splice(idx, 1);
            mesh.material.dispose();
            if (onDone) onDone();
        }
    }
    requestAnimationFrame(step);
}

function easeOutBack(x) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

let filterAnim = null;
function applyCategoryFilter(animate = true) {
    const cat = state.selectedCategory;
    if (filterAnim) { cancelAnimationFrame(filterAnim); filterAnim = null; }

    const start = performance.now();
    const dur = animate ? 350 : 0;
    const visible = stars.filter(s => cat === 'all' || s.category === cat);

    function step(now) {
        const t = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
        const ease = easeOutCubic(t);
        memoryStars.forEach(m => {
            const starId = m.userData.starId;
            const shouldShow = visible.some(s => s.id === starId);
            const targetOpacity = shouldShow ? 1 : 0;
            const targetScale = shouldShow ? m.userData.baseScale : 0.01;
            m.material.opacity = targetOpacity * ease;
            m.material.transparent = true;
            const sc = targetScale * ease;
            m.scale.set(Math.max(0.01, sc), Math.max(0.01, sc), Math.max(0.01, sc));
        });
        if (t < 1) {
            filterAnim = requestAnimationFrame(step);
        } else {
            memoryStars.forEach(m => {
                const starId = m.userData.starId;
                const shouldShow = visible.some(s => s.id === starId);
                m.visible = shouldShow;
                if (shouldShow) {
                    m.material.opacity = 1;
                    m.scale.set(m.userData.baseScale, m.userData.baseScale, m.userData.baseScale);
                }
            });
        }
    }
    requestAnimationFrame(step);
}

function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

let ambientRotation = 0;
function updateAmbientRotation(delta) {
    ambientRotation += 0.0005 * delta * 60;
    starField.rotation.y = ambientRotation;
}

function updateMemoryStars(time) {
    memoryStars.forEach(m => {
        if (m.visible === false) return;
        const scaleFactor = 1 + Math.sin(time + m.userData.pulsePhase) * 0.1;
        if (!m.userData._holding) {
            m.scale.set(
                m.userData.baseScale * scaleFactor,
                m.userData.baseScale * scaleFactor,
                m.userData.baseScale * scaleFactor
            );
        }
    });
}

const particleCanvas = document.getElementById('particle-canvas');
const pctx = particleCanvas ? particleCanvas.getContext('2d') : null;
let particles = [];

function resizeParticles() {
    if (!particleCanvas) return;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    initParticles();
}

function initParticles() {
    if (!pctx) return;
    const count = state.reducedMotion ? 20 : Math.min(90, Math.floor(window.innerWidth * window.innerHeight / 16000));
    particles = [];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            r: Math.random() * 2.2 + 0.4,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.12,
            o: Math.random() * 0.5 + 0.15,
            tw: Math.random() * 6.28,
        });
    }
}

let lastParticleDraw = 0;
function drawParticles(time) {
    if (!pctx) return;
    if (state.reducedMotion) {
        if (time - lastParticleDraw > 2000) {
            renderParticles(0);
            lastParticleDraw = time;
        }
        return;
    }
    renderParticles(time);
}

function renderParticles(time) {
    pctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    const glowColor = state.starGlowColor;
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = particleCanvas.width + 5;
        if (p.x > particleCanvas.width + 5) p.x = -5;
        if (p.y < -5) p.y = particleCanvas.height + 5;
        if (p.y > particleCanvas.height + 5) p.y = -5;
        const twinkle = 0.6 + 0.4 * Math.sin(time * 0.001 + p.tw);
        pctx.beginPath();
        pctx.arc(p.x, p.y, p.r, 0, 6.283);
        pctx.fillStyle = glowColor;
        pctx.globalAlpha = p.o * twinkle;
        pctx.fill();
    });
    pctx.globalAlpha = 1;
}

const AudioManager = (() => {
    let ctx = null;
    let master = null;
    let musicGain = null;
    let sfxGain = null;
    let musicNodes = null;
    let initialized = false;
    let audioAvailable = true;

    function ensureContext() {
        if (!initialized) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                master = ctx.createGain();
                master.connect(ctx.destination);
                musicGain = ctx.createGain();
                sfxGain = ctx.createGain();
                musicGain.connect(master);
                sfxGain.connect(master);
                master.gain.value = state.audio.volume;
                musicGain.gain.value = state.audio.musicOn ? 0.5 : 0;
                sfxGain.gain.value = state.audio.sfxOn ? 1 : 0;
                initialized = true;
            } catch (e) {
                audioAvailable = false;
            }
        }
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
        return audioAvailable && ctx;
    }

    function startAmbient() {
        if (!ctx || musicNodes || !state.audio.musicOn) return;
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = 55;
        osc2.type = 'sine';
        osc2.frequency.value = 55.7;
        gain.gain.value = 0;
        lfo.type = 'sine';
        lfo.frequency.value = 0.08;
        lfoGain.gain.value = 0.04;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(musicGain);
        gain.gain.linearRampToValueAtTime(0.12, now + 2);
        osc1.start();
        osc2.start();
        lfo.start();
        musicNodes = { osc1, osc2, lfo };
    }

    function stopAmbient() {
        if (musicNodes) {
            const now = ctx.currentTime;
            musicNodes.osc1.stop(now + 0.5);
            musicNodes.osc2.stop(now + 0.5);
            musicNodes.lfo.stop(now + 0.5);
            musicNodes = null;
        }
    }

    function playTone(freq, duration, type = 'sine', vol = 0.2, slideTo = null) {
        if (!ensureContext() || !state.audio.sfxOn) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(vol, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + duration + 0.05);
    }

    return {
        init() { ensureContext(); },
        resume() { ensureContext(); },
        setVolume(v) {
            state.audio.volume = v;
            if (master) master.gain.value = v;
            savePrefs();
        },
        setMusicOn(on) {
            state.audio.musicOn = on;
            if (on) { if (ensureContext()) startAmbient(); }
            else if (musicNodes) stopAmbient();
            savePrefs();
        },
        setSfxOn(on) {
            state.audio.sfxOn = on;
            if (sfxGain) sfxGain.gain.value = on ? 1 : 0;
            savePrefs();
        },
        holdTick() { playTone(440, 0.06, 'sine', 0.05); },
        holdComplete() { playTone(523.25, 0.25, 'sine', 0.2, 784); },
        holdCancel() { playTone(300, 0.12, 'triangle', 0.08, 200); },
        categorySelect() { playTone(660, 0.1, 'tri', 0.12, 880); },
        detailsOpen() { playTone(392, 0.2, 'sine', 0.15, 523); },
        deleteConfirm() { playTone(220, 0.3, 'sawtooth', 0.12, 110); },
        unfurl() { if (ensureContext() && state.audio.musicOn) startAmbient(); },
    };
})();

const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();

function getStarAtNDC(nx, ny) {
    mouseNDC.set(nx, ny);
    raycaster.setFromCamera(mouseNDC, camera);
    const intersects = raycaster.intersectObjects(memoryStars);
    return intersects.length > 0 ? intersects[0].object : null;
}

function getStarAtClient(clientX, clientY) {
    const nx = (clientX / window.innerWidth) * 2 - 1;
    const ny = -(clientY / window.innerHeight) * 2 + 1;
    return getStarAtNDC(nx, ny);
}

let lastHovered = null;
function updateCrosshair(e) {
    const crosshair = document.getElementById('crosshair');
    if (!crosshair) return;
    const star = getStarAtClient(e.clientX, e.clientY);
    if (star) {
        if (lastHovered !== star) {
            crosshair.classList.add('hovered');
            lastHovered = star;
        }
    } else {
        if (lastHovered) {
            crosshair.classList.remove('hovered');
            lastHovered = null;
        }
    }
}

const HOLD_DURATION = 3000;
const holdProgressEl = document.getElementById('hold-progress');
const holdProgressBar = document.getElementById('hold-progress-bar');
const holdProgressText = document.getElementById('hold-progress-text');
const CIRCUMFERENCE = 2 * Math.PI * 36;

let holdState = null;

function startHold(mesh, pointerId) {
    if (holdState) return;
    if (state.motionActive) return;
    if (mesh.visible === false) return;

    holdState = { mesh, startTime: performance.now(), pointerId, lastTick: performance.now() };
    mesh.userData._holding = true;
    state.holdProgress = 0;
    if (holdProgressEl) holdProgressEl.classList.add('visible');
    if (holdProgressBar) {
        holdProgressBar.style.strokeDasharray = CIRCUMFERENCE;
        holdProgressBar.style.strokeDashoffset = CIRCUMFERENCE;
    }
    if (holdProgressText) holdProgressText.textContent = '3';
}

function updateHold(now) {
    if (!holdState) return;
    const elapsed = now - holdState.startTime;
    const progress = Math.min(1, elapsed / HOLD_DURATION);
    state.holdProgress = progress;

    const mesh = holdState.mesh;
    const scale = mesh.userData.baseScale * (1 + progress * 0.5);
    mesh.scale.set(scale, scale, scale);
    mesh.material.opacity = 1;
    const glow = new THREE.Color(state.starGlowColor);
    glow.multiplyScalar(0.6 + progress * 0.4);
    mesh.material.color.copy(glow);

    if (holdProgressBar) {
        holdProgressBar.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    }
    if (holdProgressText) {
        const secs = Math.ceil((HOLD_DURATION - elapsed) / 1000);
        holdProgressText.textContent = Math.max(0, secs);
    }

    if (elapsed - holdState.lastTick >= 1000) {
        holdState.lastTick += 1000;
        AudioManager.holdTick();
    }

    if (progress >= 1) {
        completeHold();
    }
}

function cancelHold() {
    if (!holdState) return;
    const mesh = holdState.mesh;
    holdState = null;
    state.holdProgress = 0;
    if (mesh) {
        mesh.userData._holding = false;
        const baseScale = mesh.userData.baseScale;
        mesh.scale.set(baseScale, baseScale, baseScale);
        mesh.material.color.set(state.starGlowColor);
        mesh.material.opacity = 1;
    }
    if (holdProgressEl) holdProgressEl.classList.remove('visible');
    AudioManager.holdCancel();
}

function pulseStar(mesh) {
    const base = mesh.userData.baseScale;
    const start = performance.now();
    const dur = 350;
    function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const pulse = 1 + Math.sin(t * Math.PI) * 0.6;
        mesh.scale.set(base * pulse, base * pulse, base * pulse);
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

function completeHold() {
    const mesh = holdState.mesh;
    holdState = null;
    state.holdProgress = 0;
    if (!mesh) return;
    mesh.userData._holding = false;
    if (holdProgressEl) holdProgressEl.classList.remove('visible');

    pulseStar(mesh);
    AudioManager.holdComplete();
    AudioManager.detailsOpen();

    const star = stars.find(s => s.id === mesh.userData.starId);
    if (star) openDetails(star);
}

let isPointerDown = false;
let downPointerId = null;
let downClient = null;
let downMotionOffset = { x: 0, y: 0 };
let dragThresholdMet = false;
let downStar = null;

function onPointerDown(e) {
    if (e.target.closest('.interactive')) return;
    if (state.motionActive) return;
    if (isPointerDown) return;

    AudioManager.resume();
    AudioManager.unfurl();

    isPointerDown = true;
    downPointerId = e.pointerId;
    downClient = { x: e.clientX, y: e.clientY };
    downMotionOffset = { x: e.clientX, y: e.clientY };
    dragThresholdMet = false;
    downStar = getStarAtClient(e.clientX, e.clientY);

    if (downStar && downStar.visible !== false) {
        startHold(downStar, e.pointerId);
    }
}

function onPointerMove(e) {
    if (e.target.closest('.interactive')) return;
    updateCrosshair(e);

    if (!isPointerDown || e.pointerId !== downPointerId) return;

    if (!state.motionActive) {
        const dx = e.clientX - downMotionOffset.x;
        const dy = e.clientY - downMotionOffset.y;
        if (Math.abs(e.clientX - downClient.x) + Math.abs(e.clientY - downClient.y) > 8) {
            dragThresholdMet = true;
            if (holdState) cancelHold();
            downStar = null;
        }
        if (dragThresholdMet) {
            manualYaw -= dx * 0.003;
            manualPitch += dy * 0.003;
            manualPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, manualPitch));
        }
        downMotionOffset.x = e.clientX;
        downMotionOffset.y = e.clientY;
    }
}

function onPointerUp(e) {
    if (e.pointerId !== downPointerId) return;
    isPointerDown = false;
    downPointerId = null;
    downStar = null;

    if (holdState && holdState.pointerId === e.pointerId) {
        cancelHold();
    }
    updateCrosshair(e);
}

function onPointerCancel(e) {
    if (e.pointerId === downPointerId) {
        isPointerDown = false;
        downPointerId = null;
        downStar = null;
        if (holdState) cancelHold();
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const star = lastHovered;
        if (star && star.visible !== false && !holdState) {
            startHold(star, 'keyboard');
            requestAnimationFrame(updateHold);
        }
    }
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && holdState && holdState.pointerId === 'keyboard') {
        cancelHold();
    }
});

renderer.domElement.style.touchAction = 'none';

let rawAlpha = 0, rawBeta = 0, rawGamma = 0;
let smoothAlpha = 0, smoothBeta = 0, smoothGamma = 0;
let manualYaw = 0, manualPitch = 0;

function handleOrientation(event) {
    rawAlpha = event.alpha !== null ? event.alpha : 0;
    rawBeta = event.beta !== null ? event.beta : 0;
    rawGamma = event.gamma !== null ? event.gamma : 0;

    const alphaElem = document.getElementById('alpha');
    const betaElem = document.getElementById('beta');
    const gammaElem = document.getElementById('gamma');
    if (alphaElem) alphaElem.innerText = Math.round(rawAlpha);
    if (betaElem) betaElem.innerText = Math.round(rawBeta);
    if (gammaElem) gammaElem.innerText = Math.round(rawGamma);

    if (event.beta !== null || event.gamma !== null) {
        state.motionActive = true;
        const l = 0.15;
        smoothAlpha += (rawAlpha - smoothAlpha) * l;
        smoothBeta += (rawBeta - smoothBeta) * l;
        smoothGamma += (rawGamma - smoothGamma) * l;
    }
}

const permissionBtn = document.getElementById('request-permission-btn');
if (permissionBtn) {
    permissionBtn.addEventListener('click', () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        permissionBtn.style.display = 'none';
                        window.addEventListener('deviceorientation', handleOrientation);
                    } else {
                        state.motionActive = false;
                        permissionBtn.textContent = 'motion denied — using touch';
                        permissionBtn.disabled = true;
                    }
                })
                .catch((err) => {
                    console.warn('Motion permission error:', err);
                    state.motionActive = false;
                    permissionBtn.textContent = 'motion unavailable — using touch';
                    permissionBtn.disabled = true;
                });
        } else {
            permissionBtn.style.display = 'none';
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', handleOrientation);
            } else {
                permissionBtn.textContent = 'motion unavailable — using touch';
                permissionBtn.disabled = true;
            }
        }
    });
}

if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', handleOrientation);
}

let currentCameraQuaternion = new THREE.Quaternion();
const targetQuaternion = new THREE.Quaternion();

function updateCamera(delta) {
    if (state.motionActive) {
        const alpha = THREE.MathUtils.degToRad(smoothAlpha);
        const beta = THREE.MathUtils.degToRad(smoothBeta);
        const gamma = THREE.MathUtils.degToRad(smoothGamma);

        const qEuler = new THREE.Euler(beta, alpha, -gamma, 'YXZ');
        targetQuaternion.setFromEuler(qEuler);
        const correction = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
        targetQuaternion.multiply(correction);
        currentCameraQuaternion.slerp(targetQuaternion, 0.2);
        camera.quaternion.copy(currentCameraQuaternion);
    } else {
        const manualQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(manualPitch, manualYaw, 0, 'YXZ'));
        currentCameraQuaternion.slerp(manualQuaternion, 0.15);
        camera.quaternion.copy(currentCameraQuaternion);
    }
}

const detailsPanel = document.getElementById('details-panel');
const detailsClose = document.getElementById('details-close');
const detailsTitle = document.getElementById('details-title');
const detailsCategory = document.getElementById('details-category');
const detailsText = document.getElementById('details-text');
const detailsImage = document.getElementById('details-image');
const detailsImageFallback = document.getElementById('details-image-fallback');
const deleteBtn = document.getElementById('delete-btn');

function openDetails(star) {
    state.selectedStar = star;
    if (!detailsPanel) return;

    detailsTitle.textContent = star.name || 'star';
    detailsCategory.textContent = star.category || 'featured';
    detailsText.textContent = `"${star.message}"`;

    if (star.image) {
        detailsImage.classList.remove('hidden');
        detailsImageFallback.classList.add('hidden');
        detailsImage.src = star.image;
        detailsImage.classList.remove('loaded');
        if (detailsImage.complete && detailsImage.naturalWidth > 0) {
            detailsImage.classList.add('loaded');
        }
    } else {
        detailsImage.classList.add('hidden');
        detailsImage.src = '';
        detailsImageFallback.classList.remove('hidden');
    }

    detailsPanel.classList.add('open');
}

function closeDetails() {
    if (!detailsPanel) return;
    detailsPanel.classList.remove('open');
    state.selectedStar = null;
}

if (detailsClose) detailsClose.addEventListener('click', closeDetails);

if (detailsImage) {
    detailsImage.addEventListener('load', () => {
        detailsImage.classList.add('loaded');
        detailsImageFallback.classList.add('hidden');
    });
    detailsImage.addEventListener('error', () => {
        detailsImage.classList.add('hidden');
        detailsImage.src = '';
        detailsImageFallback.classList.remove('hidden');
    });
}

const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const deleteText = document.getElementById('delete-text');

if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
        if (!state.selectedStar) return;
        if (deleteText) deleteText.textContent = `"${state.selectedStar.message}" will be lost from the cosmos forever.`;
        AudioManager.categorySelect();
        if (deleteModal) deleteModal.classList.add('active');
    });
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
        if (!state.selectedStar) return;
        const idToDelete = state.selectedStar.id;
        AudioManager.deleteConfirm();
        if (deleteModal) deleteModal.classList.remove('active');
        closeDetails();

        stars = stars.filter(s => s.id !== idToDelete);
        persistStars();

        animateStarRemove(idToDelete, () => {
            applyCategoryFilter(false);
        });
    });
}

if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
        if (deleteModal) deleteModal.classList.remove('active');
    });
}

const categoryPills = document.getElementById('category-pills');
if (categoryPills) {
    categoryPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        const cat = pill.dataset.category;
        if (!cat || cat === state.selectedCategory) return;
        state.selectedCategory = cat;
        categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        AudioManager.categorySelect();
        applyCategoryFilter(true);
    });
}

const glowColorBtn = document.getElementById('glow-color-btn');
let globalPicker = null;
if (glowColorBtn) {
    glowColorBtn.addEventListener('click', () => {
        if (!globalPicker) {
            globalPicker = document.createElement('input');
            globalPicker.type = 'color';
            globalPicker.value = state.starGlowColor;
            globalPicker.style.position = 'fixed';
            globalPicker.style.opacity = '0';
            globalPicker.style.pointerEvents = 'none';
            globalPicker.style.width = '0';
            globalPicker.style.height = '0';
            globalPicker.addEventListener('input', () => {
                state.starGlowColor = globalPicker.value;
                applyGlowColor();
                savePrefs();
                AudioManager.categorySelect();
            });
            document.body.appendChild(globalPicker);
        }
        globalPicker.value = state.starGlowColor;
        globalPicker.click();
    });
}

const horizonBtn = document.getElementById('new-horizon-btn');
const subModal = document.getElementById('submission-modal');
const closeSubBtn = document.getElementById('close-sub-btn');
const submitMemBtn = document.getElementById('submit-memory-btn');
const userMemInput = document.getElementById('user-memory-input');
const starColorPicker = document.getElementById('star-color-picker');
const newStarCategory = document.getElementById('new-star-category');

if (horizonBtn && subModal) {
    horizonBtn.addEventListener('click', () => {
        AudioManager.resume();
        AudioManager.unfurl();
        subModal.classList.add('active');
    });
}

if (closeSubBtn && subModal) {
    closeSubBtn.addEventListener('click', () => {
        subModal.classList.remove('active');
    });
}

if (submitMemBtn && userMemInput && starColorPicker && subModal) {
    submitMemBtn.addEventListener('click', () => {
        const val = userMemInput.value.trim();
        const hexVal = starColorPicker.value;
        const cat = newStarCategory ? newStarCategory.value : 'featured';
        if (val) {
            const newStar = {
                id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
                name: 'New Memory',
                message: val,
                category: cat,
                color: hexVal,
                image: 'img/large_star.png',
                createdAt: Date.now(),
            };
            stars.push(newStar);
            persistStars();
            createMemoryStarNode(newStar);
            applyGlowColor();
            applyCategoryFilter(true);
            userMemInput.value = '';
            subModal.classList.remove('active');
            AudioManager.detailsOpen();
        }
    });
}

const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        const memoryModalElem = document.getElementById('memory-modal');
        if (memoryModalElem) memoryModalElem.classList.remove('active');
    });
}

const musicToggle = document.getElementById('music-toggle');
const sfxToggle = document.getElementById('sfx-toggle');
const volumeSlider = document.getElementById('volume-slider');

function syncAudioUI() {
    if (musicToggle) musicToggle.classList.toggle('on', state.audio.musicOn);
    if (sfxToggle) sfxToggle.classList.toggle('on', state.audio.sfxOn);
    if (volumeSlider) volumeSlider.value = Math.round(state.audio.volume * 100);
}

if (musicToggle) {
    musicToggle.addEventListener('click', () => {
        AudioManager.resume();
        AudioManager.setMusicOn(!state.audio.musicOn);
        syncAudioUI();
    });
}
if (sfxToggle) {
    sfxToggle.addEventListener('click', () => {
        AudioManager.setSfxOn(!state.audio.sfxOn);
        syncAudioUI();
    });
}
if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
        AudioManager.setVolume(volumeSlider.value / 100);
    });
}

function autoplayUnlock() {
    AudioManager.resume();
    AudioManager.unfurl();
}
window.addEventListener('pointerdown', autoplayUnlock, { once: true });
window.addEventListener('touchstart', autoplayUnlock, { once: true });

let lastTime = performance.now();

function animate() {
    const now = performance.now();
    const delta = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    updateCamera(delta);
    updateAmbientRotation(delta);

    const time = now * 0.003;
    updateMemoryStars(time);

    if (holdState) {
        updateHold(now);
    }

    drawParticles(now);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function init() {
    loadPrefs();

    stars.forEach(s => createMemoryStarNode(s));

    applyGlowColor();
    syncAudioUI();
    resizeParticles();

    const canvas = renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    animate();
}

init();
