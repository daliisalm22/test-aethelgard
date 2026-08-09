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

const textureLoader = new THREE.TextureLoader();
const textureSmall = textureLoader.load('img/small_star.png');
const textureMedium = textureLoader.load('img/medium_star.png');
const textureLarge = textureLoader.load('img/large_star.png');

const bubbleRadius = 1500;

function createStarFieldTexture(count, size, texture) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = bubbleRadius * Math.cbrt(Math.random());

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        map: texture,
        size: size,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
}

const smallBgStars = createStarFieldTexture(1000, 12, textureSmall);
const mediumBgStars = createStarFieldTexture(500, 24, textureMedium);

scene.add(smallBgStars);
scene.add(mediumBgStars);

const memoryStars = [];
const numMemories = 40;
const sampleMemories = [
    "A quiet night under the old observatory.",
    "First lines of code that actually compiled.",
    "Looking for constellations that didn't exist."
];

const memoryMaterials = [
    new THREE.SpriteMaterial({ map: textureMedium, transparent: true, blending: THREE.AdditiveBlending }),
    new THREE.SpriteMaterial({ map: textureLarge, transparent: true, blending: THREE.AdditiveBlending })
];

for (let i = 0; i < numMemories; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = (bubbleRadius * 0.7) * Math.cbrt(Math.random());

    const isLarge = Math.random() > 0.5;
    const matIndex = isLarge ? 1 : 0;
    const sprite = new THREE.Sprite(memoryMaterials[matIndex]);

    const baseScale = isLarge ? 60 : 35;
    sprite.scale.set(baseScale, baseScale, 1);

    sprite.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
    );
    
    sprite.userData = {
        message: sampleMemories[Math.floor(Math.random() * sampleMemories.length)]
    };

    scene.add(sprite);
    memoryStars.push(sprite);
}

let isMouseDown = false;
let mouseX = 0, mouseY = 0;

let manualYaw = 0;
let manualPitch = 0;

let rawAlpha = 0;
let rawBeta = 0;
let rawGamma = 0;
let motionActive = false;

window.addEventListener('mousedown', (e) => { 
    if (e.target.closest('.interactive')) return;
    if (motionActive) return;
    isMouseDown = true; 
    mouseX = e.clientX; 
    mouseY = e.clientY; 
});

window.addEventListener('mousemove', (e) => {
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

    smallBgStars.rotation.y += 0.0003;
    mediumBgStars.rotation.y += 0.0005;

    renderer.render(scene, camera);
}

animate();