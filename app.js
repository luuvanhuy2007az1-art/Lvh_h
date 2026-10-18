const canvas = document.getElementById('glitterCanvas');
const ctx = canvas.getContext('2d', { alpha: true });
let width, height, particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize); resize();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.color = Math.random() > 0.5 ? '#58a6ff' : '#a371f7';
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        if (this.y > height) { this.y = -10; this.x = Math.random() * width; }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Giảm xuống 80 hạt để mượt hơn
for (let i = 0; i < 80; i++) particles.push(new Particle());

let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);
    if (time - lastTime < 8) return; // Giới hạn ~120fps
    lastTime = time;
    
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    for (let p of particles) { p.update(); p.draw(); }
}
requestAnimationFrame(animate);
