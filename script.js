import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

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
const starMaterial = new THREE.PointsMaterial({ color: 0xf1edee, size: 6, sizeAttenuation: true });
const starField = new THREE.Points(starGeometry, starMaterial);
scene.add(starField);

const memoryStars = [];
const numMemories = 40;
const sampleMemories = [
    "A quiet night under the old observatory.",
    "First lines of code that actually compiled.",
    "Looking for constellations that didn't exist."
];

const memoryGeo = new THREE.SphereGeometry(10, 16, 16);
const lilacShades = [0xdad6fa, 0xb2afd0, 0x797a96, 0x5d5777, 0x9b8fc9, 0xc4bffa];

for (let i = 0; i < numMemories; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = (bubbleRadius * 0.8) * Math.cbrt(Math.random());

    const randomLilac = lilacShades[Math.floor(Math.random() * lilacShades.length)];
    const material = new THREE.MeshBasicMaterial({ color: randomLilac });
    const memoryStar = new THREE.Mesh(memoryGeo, material);
    memoryStar.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
    
    memoryStar.userData = {
        message: sampleMemories[Math.floor(Math.random() * sampleMemories.length)]
    };

    scene.add(memoryStar);
    memoryStars.push(memoryStar);
}

let isMouseDown = false;
let mouseX = 0, mouseY = 0;

let manualYaw = 0;
let manualPitch = 0;

let isTiltActive = false;
let deviceQuaternion = new THREE.Quaternion();
let manualQuaternion = new THREE.Quaternion();
let baseDeviceQuaternion = null;
let hasBaseOrientation = false;

window.addEventListener('mousedown', (e) => { 
    if (e.target.closest('.interactive')) return;
    isMouseDown = true; 
    mouseX = e.clientX; 
    mouseY = e.clientY; 
});

window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    manualYaw -= (e.clientX - mouseX) * 0.003;
    manualPitch += (e.clientY - mouseY) * 0.003;
    manualPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, manualPitch));
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
    manualYaw -= (e.touches[0].clientX - mouseX) * 0.003;
    manualPitch += (e.touches[0].clientY - mouseY) * 0.003;
    manualPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, manualPitch));
    mouseX = e.touches[0].clientX; 
    mouseY = e.touches[0].clientY;
});

window.addEventListener('touchend', () => { isMouseDown = false; });

const permissionBtn = document.getElementById('request-permission-btn');
const alphaElem = document.getElementById('alpha');
const betaElem = document.getElementById('beta');
const gammaElem = document.getElementById('gamma');

if (permissionBtn) {
    permissionBtn.addEventListener('click', () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        isTiltActive = true;
                        permissionBtn.style.display = 'none';
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation, true);
            isTiltActive = true;
            permissionBtn.style.display = 'none';
        }
    });
}

function handleOrientation(e) {
    if (e.alpha === null || e.beta === null || e.gamma === null) return;

    if (alphaElem) alphaElem.textContent = e.alpha.toFixed(1);
    if (betaElem) betaElem.textContent = e.beta.toFixed(1);
    if (gammaElem) gammaElem.textContent = e.gamma.toFixed(1);

    const alpha = THREE.MathUtils.degToRad(e.alpha);
    const beta = THREE.MathUtils.degToRad(e.beta);
    const gamma = THREE.MathUtils.degToRad(e.gamma);

    const zee = new THREE.Vector3(0, 0, 1);
    const orient = window.orientation ? THREE.MathUtils.degToRad(window.orientation) : 0;

    const euler = new THREE.Euler(beta, alpha, -gamma, 'YXZ');
    const q = new THREE.Quaternion().setFromEuler(euler);
    const qOrient = new THREE.Quaternion().setFromAxisAngle(zee, -orient);
    q.multiply(qOrient);
    const qAdjust = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    q.premultiply(qAdjust);

    if (!hasBaseOrientation) {
        baseDeviceQuaternion = q.clone().invert();
        hasBaseOrientation = true;
    }

    deviceQuaternion.copy(baseDeviceQuaternion).multiply(q);
}

let currentCameraQuaternion = new THREE.Quaternion();

function animate() {
    requestAnimationFrame(animate);

    manualQuaternion.setFromEuler(new THREE.Euler(manualPitch, manualYaw, 0, 'YXZ'));

    let targetQuaternion = new THREE.Quaternion();
    if (isTiltActive && hasBaseOrientation) {
        targetQuaternion.copy(deviceQuaternion).multiply(manualQuaternion);
    } else {
        targetQuaternion.copy(manualQuaternion);
    }

    currentCameraQuaternion.slerp(targetQuaternion, 0.15);
    camera.quaternion.copy(currentCameraQuaternion);

    starField.rotation.y += 0.0005;
    renderer.render(scene, camera);
}

animate();