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

        if (random < 0.15) {
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

    for (let i = 0; i < 300; i++) {
        const selectedStar = getRandomStarImage();

        let size;

        if (selectedStar.type === 'large') {
            size = Math.random() * 2 + 3.5;
        } else if (selectedStar.type === 'medium') {
            size = Math.random() * 0.8 + 1.8;
        } else {
            size = Math.random() * 0.8 + 0.7;
        }

        decoStars.push({
            x: (Math.random() - 0.5) * worldSize,
            y: (Math.random() - 0.5) * worldSize,
            size: size,
            image: selectedStar.image,
            baseAlpha: Math.random() * 0.35 + 0.1,
            twinkleSpeed: Math.random() * 0.015 + 0.002,
            twinkleOffset: Math.random() * Math.PI * 2
        });
    }

    const legendStars = [
        {
            x: -200,
            y: -150,
            size: 6,
            image: starImages.large,
            title: "The First Horizon",
            secret: "I left my hometown just to prove I could do it, but I miss my mom's cooking every single day.",
            imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80"
        },
        {
            x: 400,
            y: 200,
            size: 7,
            image: starImages.large,
            title: "Grandfather's Echo",
            secret: "I still keep a voicemail from my grandfather saved just to hear his laugh on hard days.",
            imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80"
        },
        {
            x: -500,
            y: 350,
            size: 5,
            image: starImages.large,
            title: "Midnight Manuscript",
            secret: "I wrote a whole novel in secret and I'm still too scared to show a single soul.",
            imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80"
        }
    ];

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
                showSecretModal(star);
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