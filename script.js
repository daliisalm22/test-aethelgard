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

// 1. Hintergrund-Sternenfeld
const numStars = 2000;
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

const starMaterial = new THREE.PointsMaterial({ color: 0xf1edee, size: 5, sizeAttenuation: true, transparent: true, opacity: 0.8 });
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

// 2. Memory-Sterne & Zitate
const memoryStars = [];
const numMemories = 45;
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
    const r = (bubbleRadius * 0.75) * Math.cbrt(Math.random());

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

// 3. Maus- & Touch-Steuerung (immer aktiv für Drag & Look)
let isMouseDown = false;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let rotationX = 0, rotationY = 0;

window.addEventListener('mousedown', (e) => { 
    if (e.target.closest('.interactive')) return;
    isMouseDown = true; 
    mouseX = e.clientX; 
    mouseY = e.clientY; 
});

window.addEventListener('mousemove', (e) => {
    const crosshair = document.getElementById('crosshair');
    
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

    if (!isMouseDown) return;
    targetRotationY += (e.clientX - mouseX) * 0.003;
    targetRotationX += (e.clientY - mouseY) * 0.003;
    targetRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationX));
    mouseX = e.clientX; 
    mouseY = e.clientY;
});

window.addEventListener('mouseup', () => { isMouseDown = false; });

window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.interactive')) return;
    if (e.touches.length === 1) { 
        isMouseDown = true; 
        mouseX = e.touches[0].clientX; 
        mouseY = e.touches[0].clientY; 
    }
});

window.addEventListener('touchmove', (e) => {
    if (!isMouseDown || e.touches.length !== 1) return;
    targetRotationY += (e.touches[0].clientX - mouseX) * 0.003;
    targetRotationX += (e.touches[0].clientY - mouseY) * 0.003;
    targetRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationX));
    mouseX = e.touches[0].clientX; 
    mouseY = e.touches[0].clientY;
});

window.addEventListener('touchend', () => { isMouseDown = false; });

// 4. Klick auf Sterne (Modals öffnen)
window.addEventListener('click', (e) => {
    if(e.target.closest('.interactive')) return;

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
        
        document.getElementById('memory-text').textContent = `"${message}"`;
        document.getElementById('memory-modal').classList.add('active');
    }
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
    document.getElementById('memory-modal').classList.remove('active');
});

// 5. New Horizon Button & Farbauswahl Logik
const horizonBtn = document.getElementById('new-horizon-btn');
const subModal = document.getElementById('submission-modal');
const closeSubBtn = document.getElementById('close-sub-btn');
const submitMemBtn = document.getElementById('submit-memory-btn');
const userMemInput = document.getElementById('user-memory-input');
const starColorPicker = document.getElementById('star-color-picker');

horizonBtn.addEventListener('click', () => {
    subModal.classList.add('active');
});

closeSubBtn.addEventListener('click', () => {
    subModal.classList.remove('active');
});

submitMemBtn.addEventListener('click', () => {
    const val = userMemInput.value.trim();
    const hexVal = starColorPicker.value;
    if(val) {
        createMemoryStarNode(val, hexVal);
        userMemInput.value = '';
        subModal.classList.remove('active');
    }
});

// 6. Gyroskop / Handy-Neigung
const permissionBtn = document.getElementById('request-permission-btn');
const alphaElem = document.getElementById('alpha');
const betaElem = document.getElementById('beta');
const gammaElem = document.getElementById('gamma');
let targetDeviceQuat = new THREE.Quaternion();
let currentDeviceQuat = new THREE.Quaternion();
let lastAlpha = null;
let accumulatedAlpha = 0;
let isGyroActive = false;

if (permissionBtn) {
    permissionBtn.addEventListener('click', () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        isGyroActive = true;
                        permissionBtn.style.display = 'none';
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation, true);
            isGyroActive = true;
            permissionBtn.style.display = 'none';
        }
    });
}

function handleOrientation(e) {
    if (e.alpha === null || e.beta === null || e.gamma === null) return;

    if (lastAlpha === null) {
        lastAlpha = e.alpha;
        accumulatedAlpha = e.alpha;
    }

    let deltaAlpha = e.alpha - lastAlpha;
    if (deltaAlpha > 180) deltaAlpha -= 360;
    if (deltaAlpha < -180) deltaAlpha += 360;
    accumulatedAlpha += deltaAlpha;
    lastAlpha = e.alpha;

    const alpha = THREE.MathUtils.degToRad(accumulatedAlpha);
    const beta = THREE.MathUtils.degToRaw ? THREE.MathUtils.degToRad(e.beta) : THREE.MathUtils.degToRad(e.beta);
    const gamma = THREE.MathUtils.degToRad(e.gamma);

    if (alphaElem) alphaElem.textContent = accumulatedAlpha.toFixed(1);
    if (betaElem) betaElem.textContent = e.beta.toFixed(1);
    if (gammaElem) gammaElem.textContent = e.gamma.toFixed(1);

    const zee = new THREE.Vector3(0, 0, 1);
    const orient = window.orientation ? THREE.MathUtils.degToRad(window.orientation) : 0;

    const euler = new THREE.Euler(THREE.MathUtils.degToRad(e.beta), alpha, -THREE.MathUtils.degToRad(e.gamma), 'YXZ');
    const q = new THREE.Quaternion().setFromEuler(euler);
    const qOrient = new THREE.Quaternion().setFromAxisAngle(zee, -orient);
    q.multiply(qOrient);
    const qAdjust = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    q.premultiply(qAdjust);

    targetDeviceQuat.copy(q);
}

// 7. Render-Schleife (kombiniert Gyro-Ausrichtung + sanfte Touch-/Maus-Rotation als Offset)
function animate() {
    requestAnimationFrame(animate);

    if (isGyroActive) {
        currentDeviceQuat.slerp(targetDeviceQuat, 0.15);
        camera.quaternion.copy(currentDeviceQuat);

        // Erlaubt zusätzlich Touch/Maus-Wischen als Drehung obendrauf, falls gewünscht
        rotationY += (targetRotationY - rotationY) * 0.05;
        rotationX += (targetRotationX - rotationX) * 0.05;
        const extraRotation = new THREE.Euler(rotationX, rotationY, 0, 'YXZ');
        camera.quaternion.multiply(new THREE.Quaternion().setFromEuler(extraRotation));
    } else {
        rotationY += (targetRotationY - rotationY) * 0.05;
        rotationX += (targetRotationX - rotationX) * 0.05;
        camera.rotation.order = 'YXZ';
        camera.rotation.y = rotationY;
        camera.rotation.x = rotationX;
    }

    starField.rotation.y += 0.0002;
    
    const time = Date.now() * 0.003;
    memoryStars.forEach((star, index) => {
        const scaleFactor = 1 + Math.sin(time + index) * 0.15;
        star.scale.set(scaleFactor, scaleFactor, scaleFactor);
    });

    renderer.render(scene, camera);
}

animate();