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

    // 2. Large Interactive "Legend" Stars (With Secrets & Images)
    const legendStars = [
        {
            x: -200, y: -150,
            size: 6,
            color: '#38bdf8', // Cyan glow
            title: "The First Horizon",
            secret: "I left my hometown just to prove I could do it, but I miss my mom's cooking every single day.",
            image: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80"
        },
        {
            x: 400, y: 200,
            size: 7,
            color: '#fbbf24', // Gold glow
            title: "Grandfather's Echo",
            secret: "I still keep a voicemail from my grandfather saved just to hear his laugh on hard days.",
            image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
        },
        {
            x: -500, y: 350,
            size: 5,
            color: '#f472b6', // Pink glow
            title: "Midnight Manuscript",
            secret: "I wrote a whole novel in secret and I'm still too scared to show a single soul.",
            image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"
        }
    ];

    // Mouse Drag Handlers for Panning
    window.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX - camera.x;
        startY = e.clientY - camera.y;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        camera.x = e.clientX - startX;
        camera.y = e.clientY - startY;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Click detection ONLY on the larger Legend Stars
    window.addEventListener('click', (e) => {
        if (e.target.closest('#secretModal')) return;

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        legendStars.forEach(star => {
            const screenX = (star.x + worldSize / 2) * camera.zoom + camera.x;
            const screenY = (star.y + worldSize / 2) * camera.zoom + camera.y;

            const distance = Math.hypot(mouseX - screenX, mouseY - screenY);
            
            // Generous hit-box radius for easy clicking
            if (distance < (star.size * camera.zoom) + 15) {
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

        // Draw Legend Stars (Bigger, glowing, distinct)
        legendStars.forEach(star => {
            const screenX = (star.x + worldSize / 2) * camera.zoom + camera.x;
            const screenY = (star.y + worldSize / 2) * camera.zoom + camera.y;

            if (screenX < -50 || screenX > canvas.width + 50 || screenY < -50 || screenY > canvas.height + 50) return;

            // Outer Glow ring
            ctx.beginPath();
            ctx.arc(screenX, screenY, (star.size + 6) * camera.zoom, 0, Math.PI * 2);
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

            // Optional title label floating underneath
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
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