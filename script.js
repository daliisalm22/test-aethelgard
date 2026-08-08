window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('starCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    let camera = { x: 0, y: 0, zoom: 1 };
    let isDragging = false;
    let startX, startY;

    const worldSize = 3000;

    // Debug values for screen display
    let rawAlpha = 0, rawBeta = 0, rawGamma = 0;
    let motionActive = false;

    // 1. Tiny Decoration Stars (Background atmosphere)
    const decoStars = [];
    for (let i = 0; i < 300; i++) {
        decoStars.push({
            x: (Math.random() - 0.5) * worldSize,
            y: (Math.random() - 0.5) * worldSize,
            size: Math.random() * 1.5 + 0.5,
            baseAlpha: Math.random() * 0.4 + 0.1,
            twinkleSpeed: Math.random() * 0.015 + 0.002,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }

    // 2. Large Interactive "Legend" Stars
    const legendStars = [
        {
            x: -200, y: -150,
            size: 6,
            color: '#38bdf8',
            title: "The First Horizon",
            secret: "I left my hometown just to prove I could do it, but I miss my mom's cooking every single day.",
            image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80"
        },
        {
            x: 400, y: 200,
            size: 7,
            color: '#fbbf24',
            title: "Grandfather's Echo",
            secret: "I still keep a voicemail from my grandfather saved just to hear his laugh on hard days.",
            image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
        },
        {
            x: -500, y: 350,
            size: 5,
            color: '#f472b6',
            title: "Midnight Manuscript",
            secret: "I wrote a whole novel in secret and I'm still too scared to show a single soul.",
            image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"
        }
    ];

    // --- MOUSE CONTROLS (Desktop Fallback) ---
    window.addEventListener('mousedown', (e) => {
        if (motionActive) return; // Disable mouse drag if phone tilt is active
        isDragging = true;
        startX = e.clientX - camera.x;
        startY = e.clientY - camera.y;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging || motionActive) return;
        camera.x = e.clientX - startX;
        camera.y = e.clientY - startY;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // --- GYROSCOPE / DEVICE ORIENTATION CONTROLS (Mobile 3D Tilt) ---
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (event) => {
            rawAlpha = event.alpha ? Math.round(event.alpha) : 0;
            rawBeta = event.beta ? Math.round(event.beta) : 0;
            rawGamma = event.gamma ? Math.round(event.gamma) : 0;

            // Update debug text on screen
            document.getElementById('debugAlpha').innerText = rawAlpha;
            document.getElementById('debugBeta').innerText = rawBeta;
            document.getElementById('debugGamma').innerText = rawGamma;

            if (event.beta !== null && event.gamma !== null) {
                motionActive = true;
                // Map gamma (left/right tilt: -90 to 90) and beta (front/back tilt: -180 to 180) to camera position
                const targetX = (canvas.width / 2) - worldSize/2 + (rawGamma * 15);
                const targetY = (canvas.height / 2) - worldSize/2 + ((rawBeta - 45) * 15);
                
                // Smooth interpolation (LERP) for fluid 3D movement
                camera.x += (targetX - camera.x) * 0.1;
                camera.y += (targetY - camera.y) * 0.1;
            }
        });
    }

    // iOS Permission Request Helper Button handler
    const gyroBtn = document.getElementById('enableGyroBtn');
    if (gyroBtn) {
        gyroBtn.addEventListener('click', () => {
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            gyroBtn.style.display = 'none';
                        }
                    }).catch(console.error);
            } else {
                gyroBtn.style.display = 'none';
            }
        });
    }

    // Click detection for legend stars
    window.addEventListener('click', (e) => {
        if (e.target.closest('#secretModal') || e.target.closest('#enableGyroBtn')) return;

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        legendStars.forEach(star => {
            const screenX = (star.x + worldSize / 2) * camera.zoom + camera.x;
            const screenY = (star.y + worldSize / 2) * camera.zoom + camera.y;

            const distance = Math.hypot(mouseX - screenX, mouseY - screenY);
            
            if (distance < (star.size * camera.zoom) + 20) {
                showSecretModal(star);
            }
        });
    });

    // Render Loop
    function animate(timestamp) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background Gradient
        const bgGradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 50,
            canvas.width / 2, canvas.height / 2, canvas.width
        );
        bgGradient.addColorStop(0, '#0b0f19');
        bgGradient.addColorStop(1, '#030712');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Decoration Stars
        decoStars.forEach(star => {
            const alpha = star.baseAlpha + Math.sin(timestamp * star.twinkleSpeed + star.twinkleOffset) * 0.15;
            const screenX = (star.x + worldSize / 2) * camera.zoom + camera.x;
            const screenY = (star.y + worldSize / 2) * camera.zoom + camera.y;

            if (screenX < -20 || screenX > canvas.width + 20 || screenY < -20 || screenY > canvas.height + 20) return;

            ctx.beginPath();
            ctx.arc(screenX, screenY, star.size * camera.zoom, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(248, 250, 252, ${Math.max(0.05, alpha)})`;
            ctx.fill();
        });

        // Draw Legend Stars
        legendStars.forEach(star => {
            const screenX = (star.x + worldSize / 2) * camera.zoom + camera.x;
            const screenY = (star.y + worldSize / 2) * camera.zoom + camera.y;

            if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) return;

            // Outer Glow ring
            ctx.beginPath();
            ctx.arc(screenX, screenY, (star.size + 8) * camera.zoom, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Core Star
            ctx.beginPath();
            ctx.arc(screenX, screenY, star.size * camera.zoom, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = star.color;
            ctx.fill();
            ctx.shadowBlur = 0; 

            // Title label
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.fillText(star.title, screenX, screenY + (star.size * camera.zoom) + 18);
        });

        requestAnimationFrame(animate);
    }

    // Modal Controls
    function showSecretModal(starData) {
        document.getElementById('modalTitle').innerText = starData.title;
        document.getElementById('secretText').innerText = `"${starData.secret}"`;
        document.getElementById('modalImage').src = starData.image;
        document.getElementById('secretModal').classList.remove('hidden');
    }

    function closeModal() {
        document.getElementById('secretModal').classList.add('hidden');
    }

    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Initialize camera centering
    camera.x = (canvas.width - worldSize) / 2;
    camera.y = (canvas.height - worldSize) / 2;

    requestAnimationFrame(animate);
});