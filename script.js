const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let camera = {
    x: 0,
    y: 0,
    zoom: 1
};

class Star {
    constructor(x, y, size, opacity, twinkleSpeed, message) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.opacity = opacity;
        this.twinkleSpeed = twinkleSpeed;
        this.message = message;
        this.isMemory = message !== "";
    }

    update() {
        this.opacity += this.twinkleSpeed;
        if (this.opacity > 1 || this.opacity < 0.2) {
            this.twinkleSpeed = -this.twinkleSpeed;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
        ctx.fillStyle = this.isMemory ? '#00ffcc' : '#ffffff';
        
        if (this.isMemory) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffcc';
        } else {
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffffff';
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const stars = [];
const numStars = 300;
const worldWidth = 3000;
const worldHeight = 3000;

const sampleMemories = [
    "A quiet night under the old observatory.",
    "First lines of code that actually compiled.",
    "Looking for constellations that didn't exist.",
    ""
];

for (let i = 0; i < numStars; i++) {
    const x = (Math.random() - 0.5) * worldWidth;
    const y = (Math.random() - 0.5) * worldHeight;
    const isSpecial = Math.random() < 0.1;
    const size = isSpecial ? Math.random() * 2.5 + 2 : Math.random() * 1.5 + 0.5;
    const opacity = Math.random();
    const twinkleSpeed = (Math.random() * 0.02) + 0.005;
    const message = isSpecial ? sampleMemories[Math.floor(Math.random() * (sampleMemories.length - 1))] : "";

    stars.push(new Star(x, y, size, opacity, twinkleSpeed, message));
}

function animate() {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    stars.forEach(star => {
        star.update();
        star.draw();
    });

    ctx.restore();
    requestAnimationFrame(animate);
}

let isDragging = false;
let startX = 0;
let startY = 0;

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - startX) / camera.zoom;
    const dy = (e.clientY - startY) / camera.zoom;

    camera.x -= dx;
    camera.y -= dy;

    startX = e.clientX;
    startY = e.clientY;
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    if (e.deltaY < 0) {
        camera.zoom *= (1 + zoomIntensity);
    } else {
        camera.zoom /= (1 + zoomIntensity);
    }
    camera.zoom = Math.max(0.5, Math.min(camera.zoom, 4));
}, { passive: false });

animate();