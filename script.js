function createStarfield(numStars = 500) {

    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;

        const size = Math.random() * 3 + 1;
        const opacity = Math.random() * 0.7 + 0.3;

        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        star.style.width = `${size}px`
        star.style.height = `${size}px`
        star.style.opacity = opacity;

        document.body.appendChild(star);
    }
}

const alphaEl = document.getElementById('alpha');
const betaEl = document.getElementById('beta');
const gammaEl = document.getElementById('gamma');

function handleOrientation(event) {
    const alpha = event.alpha ? event.alpha.toFixed(1) : 0;
    const beta = event.beta ? event.beta.toFixed(1) : 0;
    const gamma = event.gamma ? event.gamma.toFixed(1) : 0;

    alphaEl.textContent = alpha;
    betaEl.textContent = beta;
    gammaEl.textContent = gamma;
}

function initOrientation() {
    const btn = document.getElementById('request-permission-btn');

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        btn.style.display = 'inline-block';
        
        btn.addEventListener('click', () => {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                        btn.style.display = 'none';
                    } else {
                        alert('Permission denied to access orientation data.');
                    }
                })
                .catch(console.error);
        });
    } else {
        btn.style.display = 'none';
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

createStarfield(150);
initOrientation();