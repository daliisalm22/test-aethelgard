import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030712);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
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

const worldSize = 3000;
const decoStarsGroup = new THREE.Group();
scene.add(decoStarsGroup);

const decoStarsData = [];
const MIN_STAR_DISTANCE = 65;
const MAX_GENERATION_ATTEMPTS = 100;

for (let i = 0; i < 500; i++) {
    let placed = false;
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
        const random = Math.random();
        let size;
        if (random < 0.055) {
            size = Math.random() * 3 + 20;
        } else if (random < 0.20) {
            size = Math.random() * 3.5 + 15;
        } else {
            size = Math.random() * 2 + 10;
        }

        const x = (Math.random() - 0.5) * worldSize;
        const y = (Math.random() - 0.5) * worldSize;
        const z = (Math.random() - 0.5) * worldSize;

        let tooClose = false;
        for (const existingStar of decoStarsData) {
            const distance = Math.hypot(x - existingStar.x, y - existingStar.y, z - existingStar.z);
            const requiredDistance = Math.max(MIN_STAR_DISTANCE, (size + existingStar.size) * 1.25);
            if (distance < requiredDistance) {
                tooClose = true;
                break;
            }
        }

        if (tooClose) continue;

        decoStarsData.push({ x, y, z, size });

        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 1500 * Math.cbrt(Math.random());

        const posX = r * Math.sin(phi) * Math.cos(theta);
        const posY = r * Math.sin(phi) * Math.sin(theta);
        const posZ = r * Math.cos(phi);

        const geometry = new THREE.SphereGeometry(size * 0.4, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0xf1edee,
            transparent: true,
            opacity: Math.random() * 0.35 + 0.1
        });

        const starMesh = new THREE.Mesh(geometry, material);
        starMesh.position.set(posX, posY, posZ);

        starMesh.userData = {
            baseAlpha: material.opacity,
            twinkleSpeed: Math.random() * 0.003 + 0.0005,
            twinkleOffset: Math.random() * Math.PI * 2
        };

        decoStarsGroup.add(starMesh);
        placed = true;
        break;
    }
}

let memoryStars = JSON.parse(localStorage.getItem('timeCapsuleMemories') || '[]');
const memoryGroup = new THREE.Group();
scene.add(memoryGroup);
const memoryMeshes = [];

function saveMemoryStars() {
    localStorage.setItem('timeCapsuleMemories', JSON.stringify(memoryStars));
}

function renderMemoryStars() {
    while (memoryGroup.children.length > 0) {
        memoryGroup.remove(memoryGroup.children[0]);
    }
    memoryMeshes.length = 0;

    memoryStars.forEach(memory => {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 1200 * Math.cbrt(Math.random());

        const posX = r * Math.sin(phi) * Math.cos(theta);
        const posY = r * Math.sin(phi) * Math.sin(theta);
        const posZ = r * Math.cos(phi);

        const geometry = new THREE.SphereGeometry(memory.size * 0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x797a96 });
        const starMesh = new THREE.Mesh(geometry, material);
        starMesh.position.set(posX, posY, posZ);

        starMesh.userData = memory;
        memoryGroup.add(starMesh);
        memoryMeshes.push(starMesh);
    });
}
renderMemoryStars();

function createMemoryModal() {
    if (document.getElementById('memoryCreateModal')) return;
    const modal = document.createElement('div');
    modal.id = 'memoryCreateModal';
    modal.className = 'hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md';
    modal.innerHTML = `
        <div class="bg-slate-900/95 border border-slate-700/70 p-7 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl mx-4">
            <div class="mb-6">
                <p class="text-xs tracking-widest text-sky-400 uppercase font-semibold">Time Capsule</p>
                <h2 class="text-2xl font-bold text-white mt-1">Leave a Memory</h2>
                <p class="text-sm text-slate-400 mt-2">Leave something behind for someone to discover among the stars.</p>
            </div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Memory title</label>
            <input id="memoryTitleInput" maxlength="20" type="text" placeholder="A summer I'll remember" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-400 transition-all mb-1">
            <div class="text-right text-xs text-slate-500 mb-5"><span id="memoryTitleCounter">0</span>/20</div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Your memory</label>
            <textarea id="memoryDescriptionInput" rows="6" placeholder="Write about something you want to remember..." class="w-full resize-none bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-400 transition-all"></textarea>
            <div class="flex justify-end gap-3 mt-6">
                <button id="cancelMemoryBtn" class="px-5 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all">Cancel</button>
                <button id="saveMemoryBtn" class="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-all">Place in the sky</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const titleInput = document.getElementById('memoryTitleInput');
    const counter = document.getElementById('memoryTitleCounter');
    titleInput.addEventListener('input', () => { counter.innerText = titleInput.value.length; });
    document.getElementById('cancelMemoryBtn').addEventListener('click', closeMemoryCreateModal);
    document.getElementById('saveMemoryBtn').addEventListener('click', saveNewMemory);
}

function openMemoryCreateModal() {
    createMemoryModal();
    document.getElementById('memoryTitleInput').value = '';
    document.getElementById('memoryDescriptionInput').value = '';
    document.getElementById('memoryTitleCounter').innerText = '0';
    document.getElementById('memoryCreateModal').classList.remove('hidden');
    setTimeout(() => { document.getElementById('memoryTitleInput').focus(); }, 50);
}

function closeMemoryCreateModal() {
    const modal = document.getElementById('memoryCreateModal');
    if (modal) modal.classList.add('hidden');
}

function saveNewMemory() {
    const titleInput = document.getElementById('memoryTitleInput');
    const descriptionInput = document.getElementById('memoryDescriptionInput');
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    if (!title) { titleInput.focus(); return; }
    if (!description) { descriptionInput.focus(); return; }

    const memory = {
        id: Date.now(),
        size: 15,
        title: title.substring(0, 20),
        description: description
    };
    memoryStars.push(memory);
    saveMemoryStars();
    renderMemoryStars();
    closeMemoryCreateModal();
}

function showMemory(memory) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md';
    modal.innerHTML = `
        <div class="bg-slate-900/95 border border-slate-700/70 p-7 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl mx-4">
            <p class="text-xs tracking-widest text-sky-400 uppercase font-semibold">Time Capsule Memory</p>
            <h2 class="text-2xl font-bold text-white mt-2 break-words">${escapeHtml(memory.title)}</h2>
            <div class="mt-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800 max-h-72 overflow-y-auto">
                <p class="text-base leading-7 text-slate-200 whitespace-pre-wrap break-words">${escapeHtml(memory.description)}</p>
            </div>
            <button class="closeMemoryViewer mt-6 w-full px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-all">Return to the stars</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('.closeMemoryViewer').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

let isMouseDown = false;
let mouseX = 0, mouseY = 0;
let manualYaw = 0;
let manualPitch = 0;
let isMotionActive = false;

let rawAlpha = 0;
let rawBeta = 0;
let rawGamma = 0;
let currentCameraQuaternion = new THREE.Quaternion();

window.addEventListener('mousedown', (e) => {
    if (e.target.closest('.interactive') || e.target.closest('button') || e.target.closest('input')) return;
    if (isMotionActive) return;
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
    if (!isMouseDown || isMotionActive) return;
    manualYaw -= (e.clientX - mouseX) * 0.003;
    manualPitch += (e.clientY - mouseY) * 0.003;
    manualPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, manualPitch));
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('mouseup', () => { isMouseDown = false; });

window.addEventListener('touchstart', (e) => {
    if (e.target.closest('.interactive') || e.target.closest('button') || e.target.closest('input')) return;
    if (isMotionActive) return;
    if (e.touches.length === 1) {
        isMouseDown = true;
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }
});

window.addEventListener('touchmove', (e) => {
    if (!isMouseDown || isMotionActive || e.touches.length !== 1) return;
    manualYaw -= (e.touches[0].clientX - mouseX) * 0.003;
    manualPitch += (e.touches[0].clientY - mouseY) * 0.003;
    manualPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, manualPitch));
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
});

window.addEventListener('touchend', () => { isMouseDown = false; });

function handleOrientation(event) {
    rawAlpha = event.alpha !== null ? event.alpha : 0;
    rawBeta = event.beta !== null ? event.beta : 0;
    rawGamma = event.gamma !== null ? event.gamma : 0;

    const alphaElement = document.getElementById('debugAlpha');
    const betaElement = document.getElementById('debugBeta');
    const gammaElement = document.getElementById('debugGamma');
    if (alphaElement) alphaElement.innerText = Math.round(rawAlpha);
    if (betaElement) betaElement.innerText = Math.round(rawBeta);
    if (gammaElement) gammaElement.innerText = Math.round(rawGamma);

    if (event.beta !== null || event.gamma !== null) {
        isMotionActive = true;
    }
}

if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', handleOrientation);
}

const gyroBtn = document.getElementById('enableGyroBtn');
if (gyroBtn) {
    gyroBtn.addEventListener('click', () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission().then(response => {
                if (response === 'granted') {
                    gyroBtn.style.display = 'none';
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    alert("Permission denied for motion sensors.");
                }
            }).catch(console.error);
        } else {
            gyroBtn.style.display = 'none';
            if (window.DeviceOrientationEvent) {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        }
    });
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (e) => {
    if (e.target.closest('#secretModal') || e.target.closest('#enableGyroBtn') || e.target.closest('button') || e.target.closest('input')) {
        return;
    }

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(memoryGroup.children);

    if (intersects.length > 0) {
        const selectedMemory = intersects[0].object.userData;
        if (selectedMemory) {
            showMemory(selectedMemory);
        }
    }
});

// Hilfsobjekte für saubere Richtungs-Quaternionen ohne Karussell-Effekt
const zee = new THREE.Vector3(0, 0, 1);
const deviceQuaternion = new THREE.Quaternion();
const screenTransform = new THREE.Quaternion();
const worldTransform = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

function animate(timestamp) {
    requestAnimationFrame(animate);

    decoStarsGroup.children.forEach(mesh => {
        const alpha = mesh.userData.baseAlpha + Math.sin(timestamp * mesh.userData.twinkleSpeed + mesh.userData.twinkleOffset) * 0.15;
        mesh.material.opacity = Math.max(0.03, Math.min(1, alpha));
    });

    let finalQuaternion = new THREE.Quaternion();

    if (isMotionActive) {
        const alpha = THREE.MathUtils.degToRad(rawAlpha);
        const beta = THREE.MathUtils.degToRad(rawBeta);
        const gamma = THREE.MathUtils.degToRad(rawGamma);

        const cAlpha = Math.cos(alpha / 2);
        const sAlpha = Math.sin(alpha / 2);
        const cBeta = Math.cos(beta / 2);
        const sBeta = Math.sin(beta / 2);
        const cGamma = Math.cos(gamma / 2);
        const sGamma = Math.sin(gamma / 2);

        deviceQuaternion.set(
            sAlpha * cBeta * cGamma - cAlpha * sBeta * sGamma,
            cAlpha * sBeta * cGamma + sAlpha * cBeta * sGamma,
            cAlpha * cBeta * sGamma - sAlpha * sBeta * cGamma,
            cAlpha * cBeta * cGamma + sAlpha * sBeta * sGamma
        );

        const orientationAngle = window.orientation ? THREE.MathUtils.degToRad(window.orientation) : 0;
        screenTransform.setFromAxisAngle(zee, -orientationAngle);
        
        finalQuaternion.copy(deviceQuaternion);
        finalQuaternion.multiply(screenTransform);
        finalQuaternion.premultiply(worldTransform);
    } else {
        finalQuaternion.setFromEuler(new THREE.Euler(manualPitch, manualYaw, 0, 'YXZ'));
    }

    currentCameraQuaternion.slerp(finalQuaternion, 0.15);
    camera.quaternion.copy(currentCameraQuaternion);

    renderer.render(scene, camera);
}

requestAnimationFrame(animate);