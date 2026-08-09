import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030816);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Sterne generieren
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

// Erinnerungs-Sterne generieren
const memoryStars = [];
const numMemories = 40;
const sampleMemories = [
    "A quiet night under the old observatory.",
    "First lines of code that actually compiled.",
    "Looking for constellations that didn't exist.",
    "We promised to meet again when the comets return.",
    "Whispering secrets into the digital void.",
    "The universe is vast, but I found your orbit."
];

const memoryGeo = new THREE.SphereGeometry(12, 24, 24);
const lilacShades = [0xdad6fa, 0xb2afd0, 0x797a96, 0x5d5777, 0x9b8fc9, 0xc4bffa];

function createMemoryStarNode(messageText, hexColor = 0xdad6fa) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = (bubbleRadius * 0.8) * Math.cbrt(Math.random());

    const material = new THREE.MeshBasicMaterial({ 
        color: hexColor,
        wireframe: false
    });
    const memoryStar = new THREE.Mesh(memoryGeo, material);
    memoryStar.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
    
    memoryStar.userData = {
        message: messageText
    };

    scene.add(memoryStar);
    memoryStars.push(memoryStar);
}

for (let i = 0; i < numMemories; i++) {
    const msg = sampleMemories[Math.floor(Math.random() * sampleMemories.length)];
    const randomLilac = lilacShades[Math.floor(Math.random() * lilacShades.length)];
    createMemoryStarNode(msg, randomLilac);
}

// Steuerung Variablen
let isMouseDown = false;
let mouseX = 0, mouseY = 0;

let manualYaw = 0;
let manualPitch = 0;

let rawAlpha = 0;
let rawBeta = 0;
let rawGamma = 0;
let motionActive = false;

// Maus- / Touch-Fallback
window.addEventListener('mousedown', (e) => { 
    if (e.target.closest('.interactive')) return;
    if (motionActive) return;
    isMouseDown = true; 
    mouseX = e.clientX; 
    mouseY = e.clientY; 
});

window.addEventListener('mousemove', (e) => {
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        const raycaster = new THREE.Raycaster();
        const mouseCoords = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouseCoords, camera);
        const intersects = raycaster.intersectObjects(memoryStars);

        if (intersects.length > 0) {
            crosshair.classList.add('hovered');
        } else {
            crosshair.classList.remove('hovered');
        }
    }

    if (!isMouseDown || motionActive) return;
    manualYaw -= (e.clientX - mouseX) * 0.003;
    manualPitch += (e.clientY - mouseY) * 0.003;
    manualPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, manualPitch));
    mouseX = e.clientX; 
    mouseY = e.clientY;
});

window.addEventListener('mouseup', () => { isMouseDown = false; });

window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.interactive')) return;
    if (motionActive) return;
    if (e.touches.length === 1) { 
        isMouseDown = true; 
        mouseX = e.touches[0].clientX; 
        mouseY = e.touches[0].clientY; 
    }
});

window.addEventListener('touchmove', (e) => {
    if (!isMouseDown || motionActive || e.touches.length !== 1) return;
    manualYaw -= (e.touches[0].clientX - mouseX) * 0.003;
    manualPitch += (e.touches[0].clientY - mouseY) * 0.003;
    manualPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, manualPitch));
    mouseX = e.touches[0].clientX; 
    mouseY = e.touches[0].clientY;
});

window.addEventListener('touchend', () => { isMouseDown = false; });

// Klick auf Sterne (Modals öffnen)
window.addEventListener('click', (e) => {
    if (e.target.closest('.interactive')) return;

    const raycaster = new THREE.Raycaster();
    const mouseCoords = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouseCoords, camera);
    const intersects = raycaster.intersectObjects(memoryStars);

    if (intersects.length > 0) {
        const selectedStar = intersects[0].object;
        const message = selectedStar.userData.message;
        
        const memoryTextElem = document.getElementById('memory-text');
        const memoryModalElem = document.getElementById('memory-modal');
        if (memoryTextElem) memoryTextElem.textContent = `"${message}"`;
        if (memoryModalElem) memoryModalElem.classList.add('active');
    }
});

const closeModalBtn = document.getElementById('close-modal-btn');
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        const memoryModalElem = document.getElementById('memory-modal');
        if (memoryModalElem) memoryModalElem.classList.remove('active');
    });
}

// New Horizon Button & Farbauswahl Logik
const horizonBtn = document.getElementById('new-horizon-btn');
const subModal = document.getElementById('submission-modal');
const closeSubBtn = document.getElementById('close-sub-btn');
const submitMemBtn = document.getElementById('submit-memory-btn');
const userMemInput = document.getElementById('user-memory-input');
const starColorPicker = document.getElementById('star-color-picker');

if (horizonBtn && subModal) {
    horizonBtn.addEventListener('click', () => {
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
        if (val) {
            createMemoryStarNode(val, hexVal);
            userMemInput.value = '';
            subModal.classList.remove('active');
        }
    });
}

// Gyroskop Event Listener
const permissionBtn = document.getElementById('enableGyroBtn') || document.getElementById('request-permission-btn');
const alphaElem = document.getElementById('alpha') || document.getElementById('debugAlpha');
const betaElem = document.getElementById('beta') || document.getElementById('debugBeta');
const gammaElem = document.getElementById('gamma') || document.getElementById('debugGamma');

function handleOrientation(event) {
    rawAlpha = event.alpha !== null ? event.alpha : 0;
    rawBeta = event.beta !== null ? event.beta : 0;
    rawGamma = event.gamma !== null ? event.gamma : 0;

    if (alphaElem) alphaElem.innerText = Math.round(rawAlpha);
    if (betaElem) betaElem.innerText = Math.round(rawBeta);
    if (gammaElem) gammaElem.innerText = Math.round(rawGamma);

    if (event.beta !== null || event.gamma !== null) {
        motionActive = true;
    }
}

if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', handleOrientation);
}

if (permissionBtn) {
    permissionBtn.addEventListener('click', () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        permissionBtn.style.display = 'none';
                        window.addEventListener('deviceorientation', handleOrientation);
                    } else {
                        alert("Permission denied for motion sensors.");
                    }
                })
                .catch(console.error);
        } else {
            permissionBtn.style.display = 'none';
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        }
    });
}

let currentCameraQuaternion = new THREE.Quaternion();
const targetQuaternion = new THREE.Quaternion();

function animate() {
    requestAnimationFrame(animate);

    if (motionActive) {
        const alpha = THREE.MathUtils.degToRad(rawAlpha);
        const beta = THREE.MathUtils.degToRad(rawBeta);
        const gamma = THREE.MathUtils.degToRad(rawGamma);

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

    starField.rotation.y += 0.0005;

    // Pulsieren der Erinnerungssterne
    const time = Date.now() * 0.003;
    memoryStars.forEach((star, index) => {
        const scaleFactor = 1 + Math.sin(time + index) * 0.15;
        star.scale.set(scaleFactor, scaleFactor, scaleFactor);
    });

    renderer.render(scene, camera);
}

animate();