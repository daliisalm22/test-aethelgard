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

const starMaterial = new THREE.PointsMaterial({
    color: 0xf1edee,
    size: 6,
    sizeAttenuation: true
});

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

for (let i = 0; i < numMemories; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = (bubbleRadius * 0.8) * Math.cbrt(Math.random());

    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffcc
    });

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
let targetRotationX = 0, targetRotationY = 0;
let rotationX = 0, rotationY = 0;

window.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;

    const deltaX = e.clientX - mouseX;
    const deltaY = e.clientY - mouseY;

    targetRotationY += deltaX * 0.003;
    targetRotationX += deltaY * 0.003;
    targetRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationX));

    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
});

window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isMouseDown = true;
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }
});

window.addEventListener('touchmove', (e) => {
    if (!isMouseDown || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - mouseX;
    const deltaY = e.touches[0].clientY - mouseY;

    targetRotationY += deltaX * 0.003;
    targetRotationX += deltaY * 0.003;
    targetRotationX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationX));

    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
});

window.addEventListener('touchend', () => {
    isMouseDown = false;
});

const permissionBtn = document.getElementById('request-permission-btn');
const alphaElem = document.getElementById('alpha');
const betaElem = document.getElementById('beta');
const gammaElem = document.getElementById('gamma');

let targetDeviceQuat = new THREE.Quaternion();
let currentDeviceQuat = new THREE.Quaternion();
let deviceQuat = new THREE.Quaternion();
let zee = new THREE.Vector3(0, 0, 1);
let expectedQuaternion = new THREE.Quaternion();
let adjustQuaternion = new THREE.Quaternion();

let lastAlpha = 0;
let alphaOffset = 0;

if (permissionBtn) {
    permissionBtn.addEventListener('click', () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation, true);
                        permissionBtn.style.display = 'none';
                    }
                })
                .catch(console.error);
        } else {
            window.addEventListener('deviceorientation', handleOrientation, true);
            permissionBtn.style.display = 'none';
        }
    });
}

function handleOrientation(e) {
    const rawAlpha = e.alpha || 0;
    const beta = e.beta ? THREE.MathUtils.degToRad(e.beta) : 0;
    const gamma = e.gamma ? THREE.MathUtils.degToRad(e.gamma) : 0;

    let deltaAlpha = rawAlpha - lastAlpha;
    if (deltaAlpha > 180) {
        alphaOffset -= 360;
    } else if (deltaAlpha < -180) {
        alphaOffset += 360;
    }
    lastAlpha = rawAlpha;

    const continuousAlpha = rawAlpha + alphaOffset;
    const alpha = THREE.MathUtils.degToRad(continuousAlpha);

    if (alphaElem) alphaElem.textContent = continuousAlpha.toFixed(1);
    if (betaElem) betaElem.textContent = e.beta ? e.beta.toFixed(1) : '0';
    if (gammaElem) gammaElem.textContent = e.gamma ? e.gamma.toFixed(1) : '0';

    const orient = window.orientation ? THREE.MathUtils.degToRad(window.orientation) : 0;

    const cEuler = new THREE.Euler();
    cEuler.set(beta, alpha, -gamma, 'YXZ');
    deviceQuat.setFromEuler(cEuler);

    expectedQuaternion.setFromAxisAngle(zee, -orient);
    deviceQuat.multiply(expectedQuaternion);

    adjustQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    deviceQuat.multiply(adjustQuaternion);

    targetDeviceQuat.copy(deviceQuat);
}

function animate() {
    requestAnimationFrame(animate);

    if (!permissionBtn || permissionBtn.style.display !== 'none') {
        currentDeviceQuat.slerp(targetDeviceQuat, 0.05);
        camera.quaternion.copy(currentDeviceQuat);
    } else {
        rotationY += (targetRotationY - rotationY) * 0.05;
        rotationX += (targetRotationX - rotationX) * 0.05;

        camera.rotation.order = 'YXZ';
        camera.rotation.y = rotationY;
        camera.rotation.x = rotationX;
    }

    starField.rotation.y += 0.0005;

    renderer.render(scene, camera);
}

animate();