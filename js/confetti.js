// Confetti burst animation for win screen

const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animId: null,

    init() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) return false;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        return true;
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    burst() {
        if (!this.canvas && !this.init()) return;

        this.stop();
        this.particles = [];
        const colors = ['#00ff66', '#33ff99', '#00cc55', '#ffffff', '#ffff44', '#ff9900', '#ff44aa'];

        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: -30 - Math.random() * 80,
                vx: (Math.random() - 0.5) * 7,
                vy: Math.random() * 3 + 1.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                w: Math.random() * 10 + 4,
                h: Math.random() * 6 + 3,
                rotation: Math.random() * 360,
                rotV: (Math.random() - 0.5) * 10,
                opacity: 1
            });
        }

        this._animate();
    },

    _animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const bottomThreshold = this.canvas.height * 0.72;

        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.07; // gravity
            p.rotation += p.rotV;
            if (p.y > bottomThreshold) {
                p.opacity = Math.max(0, p.opacity - 0.018);
            }

            if (p.opacity <= 0) return;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            this.ctx.restore();
        });

        this.particles = this.particles.filter(p => p.opacity > 0 && p.y < this.canvas.height + 40);

        if (this.particles.length > 0) {
            this.animId = requestAnimationFrame(() => this._animate());
        } else {
            this.stop();
        }
    },

    stop() {
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.particles = [];
    }
};
