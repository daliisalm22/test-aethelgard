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

    let rawAlpha = 0;
    let rawBeta = 0;
    let rawGamma = 0;
    let motionActive = false;

    const starImages = {
        small: new Image(),
        medium: new Image(),
        large: new Image()
    };

    starImages.small.src = 'small_star.png';
    starImages.medium.src = 'medium_star.png';
    starImages.large.src = 'large_star.png';

    function getRandomStarImage() {
        const random = Math.random();

        if (random < 0.055) {
            return {
                image: starImages.large,
                type: 'large'
            };
        }

        if (random < 0.20) {
            return {
                image: starImages.medium,
                type: 'medium'
            };
        }

        return {
            image: starImages.small,
            type: 'small'
        };
}

    function getImageForSize(size) {
        if (size >= 2.2) {
            return starImages.large;
        }

        if (size >= 1.3) {
            return starImages.medium;
        }

        return starImages.small;
    }

    const decoStars = [];

    for (let i = 0; i < 500; i++) {
        const selectedStar = getRandomStarImage();

        let size;

        if (selectedStar.type === 'large') {
            size = Math.random() * 3 + 20;
        } else if (selectedStar.type === 'medium') {
            size = Math.random() * 3.5 + 15;
        } else {
            size = Math.random() * 2 + 10;
        }

        decoStars.push({
            x: (Math.random() - 0.5) * worldSize,
            y: (Math.random() - 0.5) * worldSize,
            size: size,
            image: selectedStar.image,
            baseAlpha: Math.random() * 0.35 + 0.1,
            twinkleSpeed: Math.random() * 0.003 + 0.0005,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }

    const legendStars = [
        {
            x: -200,
            y: -150,
            size: 22,
            image: starImages.large,
            title: "New Horizons",
            secret: "Documenting my journey through life, one star at a time.",
            imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80"
        },
        {
            x: 400,
            y: 200,
            size: 22,
            image: starImages.large,
            title: "Clean skies",
            secret: "Cleaning all the memories of my past, hoping to find a new beginning.",
            imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
        },
        {
            x: -500,
            y: 350,
            size: 22,
            image: starImages.large,
            title: "Unknown paths",
            secret: "No idea what this button will be used for.",
            imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"
        }
    ];

    let memoryStars = JSON.parse(localStorage.getItem('timeCapsuleMemories') || '[]');

function saveMemoryStars() {
    localStorage.setItem(
        'timeCapsuleMemories',
        JSON.stringify(memoryStars)
    );
}

function createMemoryModal() {
    if (document.getElementById('memoryCreateModal')) return;

    const modal = document.createElement('div');

    modal.id = 'memoryCreateModal';
    modal.className = 'hidden fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md';

    modal.innerHTML = `
        <div class="bg-slate-900/95 border border-slate-700/70 p-7 rounded-2xl max-w-lg w-full shadow-2xl mx-4">
            <div class="mb-6">
                <p class="text-xs tracking-widest text-sky-400 uppercase font-semibold">
                    Time Capsule
                </p>
                <h2 class="text-2xl font-bold text-white mt-1">
                    Leave a Memory
                </h2>
                <p class="text-sm text-slate-400 mt-2">
                    Leave something behind for someone to discover among the stars.
                </p>
            </div>

            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Memory title
            </label>

            <input
                id="memoryTitleInput"
                maxlength="20"
                type="text"
                placeholder="A summer I'll remember"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-400 transition-all mb-1"
            >

            <div class="text-right text-xs text-slate-500 mb-5">
                <span id="memoryTitleCounter">0</span>/20
            </div>

            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Your memory
            </label>

            <textarea
                id="memoryDescriptionInput"
                rows="6"
                placeholder="Write about something you want to remember..."
                class="w-full resize-none bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-sky-400 transition-all"
            ></textarea>

            <div class="flex justify-end gap-3 mt-6">
                <button
                    id="cancelMemoryBtn"
                    class="px-5 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                    Cancel
                </button>

                <button
                    id="saveMemoryBtn"
                    class="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-all"
                >
                    Place in the sky
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const titleInput = document.getElementById('memoryTitleInput');
    const counter = document.getElementById('memoryTitleCounter');

    titleInput.addEventListener('input', () => {
        counter.innerText = titleInput.value.length;
    });

    document.getElementById('cancelMemoryBtn').addEventListener('click', () => {
        closeMemoryCreateModal();
    });

    document.getElementById('saveMemoryBtn').addEventListener('click', () => {
        saveNewMemory();
    });
}

function openMemoryCreateModal() {
    createMemoryModal();

    document.getElementById('memoryTitleInput').value = '';
    document.getElementById('memoryDescriptionInput').value = '';
    document.getElementById('memoryTitleCounter').innerText = '0';

    document
        .getElementById('memoryCreateModal')
        .classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('memoryTitleInput').focus();
    }, 50);
}

function closeMemoryCreateModal() {
    const modal = document.getElementById('memoryCreateModal');

    if (modal) {
        modal.classList.add('hidden');
    }
}

function saveNewMemory() {
    const titleInput = document.getElementById('memoryTitleInput');
    const descriptionInput = document.getElementById('memoryDescriptionInput');

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    if (!title) {
        titleInput.focus();
        return;
    }

    if (!description) {
        descriptionInput.focus();
        return;
    }

    const selectedStar = getRandomStarImage();

    const memory = {
        id: Date.now(),
        x: (Math.random() - 0.5) * worldSize,
        y: (Math.random() - 0.5) * worldSize,
        size: selectedStar.type === 'large'
            ? Math.random() * 3 + 20
            : selectedStar.type === 'medium'
                ? Math.random() * 3.5 + 15
                : Math.random() * 2 + 10,
        image: selectedStar.image.src,
        title: title.substring(0, 20),
        description: description
    };

    memoryStars.push(memory);
    saveMemoryStars();

    closeMemoryCreateModal();
}

function showMemory(memory) {
    const modal = document.createElement('div');

    modal.className =
        'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md';

    modal.innerHTML = `
        <div class="bg-slate-900/95 border border-slate-700/70 p-7 rounded-2xl max-w-lg w-full shadow-2xl mx-4">
            <p class="text-xs tracking-widest text-sky-400 uppercase font-semibold">
                Time Capsule Memory
            </p>

            <h2 class="text-2xl font-bold text-white mt-2">
                ${escapeHtml(memory.title)}
            </h2>

            <div class="mt-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <p class="text-base leading-7 text-slate-200 whitespace-pre-wrap">
                    ${escapeHtml(memory.description)}
                </p>
            </div>

            <button
                class="closeMemoryViewer mt-6 w-full px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-all"
            >
                Return to the stars
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.closeMemoryViewer').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

memoryStars.forEach(memory => {
    const image = new Image();
    image.src = memory.image;
    memory.imageObject = image;
});

    window.addEventListener('mousedown', (e) => {
        if (motionActive) return;

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

    function handleOrientation(event) {
        rawAlpha = event.alpha !== null ? Math.round(event.alpha) : 0;
        rawBeta = event.beta !== null ? Math.round(event.beta) : 0;
        rawGamma = event.gamma !== null ? Math.round(event.gamma) : 0;

        const alphaElement = document.getElementById('debugAlpha');
        const betaElement = document.getElementById('debugBeta');
        const gammaElement = document.getElementById('debugGamma');

        if (alphaElement) {
            alphaElement.innerText = rawAlpha;
        }

        if (betaElement) {
            betaElement.innerText = rawBeta;
        }

        if (gammaElement) {
            gammaElement.innerText = rawGamma;
        }

        if (event.beta !== null || event.gamma !== null) {
            motionActive = true;

            const targetX =
                (canvas.width / 2) -
                worldSize / 2 +
                (rawGamma * 15);

            const targetY =
                (canvas.height / 2) -
                worldSize / 2 +
                ((rawBeta - 45) * 15);

            camera.x += (targetX - camera.x) * 0.1;
            camera.y += (targetY - camera.y) * 0.1;
        }
    }

    if (
        window.DeviceOrientationEvent &&
        typeof DeviceOrientationEvent.requestPermission !== 'function'
    ) {
        window.addEventListener(
            'deviceorientation',
            handleOrientation
        );
    }

    const gyroBtn = document.getElementById('enableGyroBtn');

    if (gyroBtn) {
        gyroBtn.addEventListener('click', () => {
            if (
                typeof DeviceOrientationEvent !== 'undefined' &&
                typeof DeviceOrientationEvent.requestPermission === 'function'
            ) {
                DeviceOrientationEvent.requestPermission()
                    .then(response => {
                        if (response === 'granted') {
                            gyroBtn.style.display = 'none';

                            window.addEventListener(
                                'deviceorientation',
                                handleOrientation
                            );
                        } else {
                            alert("Permission denied for motion sensors.");
                        }
                    })
                    .catch(err => {
                        console.error(err);
                    });
            } else {
                gyroBtn.style.display = 'none';

                if (window.DeviceOrientationEvent) {
                    window.addEventListener(
                        'deviceorientation',
                        handleOrientation
                    );
                }
            }
        });
    }

    window.addEventListener('click', (e) => {
        if (
            e.target.closest('#secretModal') ||
            e.target.closest('#enableGyroBtn')
        ) {
            return;
        }

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        legendStars.forEach(star => {
            const screenX =
                (star.x + worldSize / 2) *
                camera.zoom +
                camera.x;

            const screenY =
                (star.y + worldSize / 2) *
                camera.zoom +
                camera.y;

            const distance = Math.hypot(
                mouseX - screenX,
                mouseY - screenY
            );

            if (
                distance <
                (star.size * camera.zoom) + 20
            ) {
                if (star.title === 'New Horizons') {
                    openMemoryCreateModal();
                } else {
                    showSecretModal(star);
                }
            }
        });

        memoryStars.forEach(memory => {
            const screenX =
                (memory.x + worldSize / 2) *
                camera.zoom +
                camera.x;

            const screenY =
                (memory.y + worldSize / 2) *
                camera.zoom +
                camera.y;

            const distance = Math.hypot(
                mouseX - screenX,
                mouseY - screenY
            );

            if (
                distance <
                (memory.size * camera.zoom) + 20
            ) {
                showMemory(memory);
            }
        });
    });

    function drawStar(star, timestamp) {
        const screenX =
            (star.x + worldSize / 2) *
            camera.zoom +
            camera.x;

        const screenY =
            (star.y + worldSize / 2) *
            camera.zoom +
            camera.y;

        if (
            screenX < -50 ||
            screenX > canvas.width + 50 ||
            screenY < -50 ||
            screenY > canvas.height + 50
        ) {
            return;
        }

        const alpha =
            star.baseAlpha +
            Math.sin(
                timestamp * star.twinkleSpeed +
                star.twinkleOffset
            ) * 0.15;

        const finalAlpha = Math.max(
            0.03,
            Math.min(1, alpha)
        );

        const image = star.image;

        if (
            !image ||
            !image.complete ||
            image.naturalWidth === 0
        ) {
            return;
        }

        const aspectRatio =
            image.naturalWidth / image.naturalHeight;

        let width =
            star.size *
            2 *
            camera.zoom;

        let height =
            width / aspectRatio;

        if (height > star.size * 2 * camera.zoom) {
            height =
                star.size *
                2 *
                camera.zoom;

            width =
                height *
                aspectRatio;
        }

        ctx.save();

        ctx.globalAlpha = finalAlpha;

        ctx.drawImage(
            image,
            screenX - width / 2,
            screenY - height / 2,
            width,
            height
        );

        ctx.restore();
    }

    function animate(timestamp) {
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        const bgGradient = ctx.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            50,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width
        );

        bgGradient.addColorStop(
            0,
            '#0b0f19'
        );

        bgGradient.addColorStop(
            1,
            '#030712'
        );

        ctx.fillStyle = bgGradient;

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        decoStars.forEach(star => {
            drawStar(star, timestamp);
        });

        legendStars.forEach(star => {
            const screenX =
                (star.x + worldSize / 2) *
                camera.zoom +
                camera.x;

            const screenY =
                (star.y + worldSize / 2) *
                camera.zoom +
                camera.y;

            if (
                screenX < -50 ||
                screenX > canvas.width + 50 ||
                screenY < -50 ||
                screenY > canvas.height + 50
            ) {
                return;
            }

            const image = star.image;

            if (
                !image ||
                !image.complete ||
                image.naturalWidth === 0
            ) {
                return;
            }

            const aspectRatio =
                image.naturalWidth /
                image.naturalHeight;

            const width =
                star.size *
                2 *
                camera.zoom;

            const height =
                width /
                aspectRatio;

            ctx.save();

            ctx.globalAlpha = 1;

            ctx.drawImage(
                image,
                screenX - width / 2,
                screenY - height / 2,
                width,
                height
            );

            ctx.restore();

            ctx.font =
                '12px Inter, sans-serif';

            ctx.fillStyle =
                'rgba(255, 255, 255, 0.8)';

            ctx.textAlign = 'center';

            ctx.fillText(
                star.title,
                screenX,
                screenY +
                (star.size * camera.zoom) +
                18
            );
        });

        memoryStars.forEach(memory => {
            const screenX =
                (memory.x + worldSize / 2) *
                camera.zoom +
                camera.x;

            const screenY =
                (memory.y + worldSize / 2) *
                camera.zoom +
                camera.y;

            if (
                screenX < -80 ||
                screenX > canvas.width + 80 ||
                screenY < -80 ||
                screenY > canvas.height + 80
            ) {
                return;
            }

            const image = memory.imageObject;

            if (
                !image ||
                !image.complete ||
                image.naturalWidth === 0
            ) {
                return;
            }

            const aspectRatio =
                image.naturalWidth / image.naturalHeight;

            const width =
                memory.size *
                2 *
                camera.zoom;

            const height =
                width / aspectRatio;

            ctx.save();

            ctx.globalAlpha = 1;

            ctx.drawImage(
                image,
                screenX - width / 2,
                screenY - height / 2,
                width,
                height
            );

            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';

            ctx.fillText(
                memory.title,
                screenX,
                screenY +
                (memory.size * camera.zoom) +
                18
            );

            ctx.restore();
        });

        requestAnimationFrame(animate);
    }

    function showSecretModal(starData) {
        document.getElementById('modalTitle').innerText =
            starData.title;

        document.getElementById('secretText').innerText =
            `"${starData.secret}"`;

        document.getElementById('modalImage').src =
            starData.imageUrl;

        document
            .getElementById('secretModal')
            .classList.remove('hidden');
    }

    function closeModal() {
        document
            .getElementById('secretModal')
            .classList.add('hidden');
    }

    const closeBtn =
        document.getElementById('closeModalBtn');

    if (closeBtn) {
        closeBtn.addEventListener(
            'click',
            closeModal
        );
    }

    camera.x =
        (canvas.width - worldSize) / 2;

    camera.y =
        (canvas.height - worldSize) / 2;

    const images = [
        starImages.small,
        starImages.medium,
        starImages.large
    ];

    let loadedImages = 0;

    function checkImagesLoaded() {
        loadedImages++;

        if (loadedImages === images.length) {
            requestAnimationFrame(animate);
        }
    }

    images.forEach(image => {
        if (
            image.complete &&
            image.naturalWidth > 0
        ) {
            checkImagesLoaded();
        } else {
            image.addEventListener(
                'load',
                checkImagesLoaded,
                { once: true }
            );
        }
    });
});