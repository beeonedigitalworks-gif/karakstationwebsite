// Water bubble animation that follows the cursor with a subtle floating effect
(function() {
    'use strict';

    class WaterBubbleEffect {
        constructor() {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.canvas.style.cssText = `
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
                opacity: 0.9;
                mix-blend-mode: screen;
            `;
            document.body.appendChild(this.canvas);

            this.resizeCanvas();
            this.bubbles = [];
            this.mouse = { x: 0, y: 0, active: false };
            this.lastTime = 0;

            window.addEventListener('mousemove', (e) => this.onPointerMove(e));
            window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: true });
            window.addEventListener('touchstart', (e) => this.onTouchMove(e), { passive: true });
            window.addEventListener('resize', () => this.resizeCanvas());

            this.animate();
        }

        resizeCanvas() {
            const ratio = window.devicePixelRatio || 1;
            this.canvas.width = Math.floor(window.innerWidth * ratio);
            this.canvas.height = Math.floor(window.innerHeight * ratio);
            this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        onPointerMove(e) {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;
            this.spawnBubbles(this.mouse.x, this.mouse.y, 2);
        }

        onTouchMove(e) {
            if (!e.touches || !e.touches[0]) {
                return;
            }

            const touch = e.touches[0];
            this.mouse.x = touch.clientX;
            this.mouse.y = touch.clientY;
            this.mouse.active = true;
            this.spawnBubbles(this.mouse.x, this.mouse.y, 1);
        }

        spawnBubbles(x, y, count) {
            for (let i = 0; i < count; i++) {
                this.bubbles.push({
                    x,
                    y,
                    size: Math.random() * 4 + 2,
                    opacity: Math.random() * 0.3 + 0.15,
                    vx: (Math.random() - 0.5) * 16,
                    vy: -Math.random() * 2 - 0.4,
                    life: 1,
                    ttl: Math.random() * 70 + 50,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: Math.random() * 0.03 + 0.01
                });
            }

            if (this.bubbles.length > 100) {
                this.bubbles.splice(0, this.bubbles.length - 100);
            }
        }

        animate(now = 0) {
            const dt = Math.min(1.5, (now - this.lastTime || 16) / 16);
            this.lastTime = now;

            this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const bubble = this.bubbles[i];
                bubble.x += bubble.vx * dt;
                bubble.y += bubble.vy * dt;
                bubble.vy -= 0.005 * dt;
                bubble.vx *= 0.98;
                bubble.life -= 0.012 * dt;
                bubble.opacity = Math.max(0, bubble.opacity - 0.004 * dt);
                bubble.wobble += bubble.wobbleSpeed * dt;

                const sway = Math.sin(bubble.wobble) * 0.8;
                bubble.x += sway * dt;

                if (bubble.life <= 0 || bubble.opacity <= 0) {
                    this.bubbles.splice(i, 1);
                    continue;
                }

                this.drawBubble(bubble);
            }

            requestAnimationFrame((time) => this.animate(time));
        }

        drawBubble(bubble) {
            const gradient = this.ctx.createRadialGradient(
                bubble.x,
                bubble.y,
                bubble.size * 0.1,
                bubble.x,
                bubble.y,
                bubble.size * 1.3
            );

            gradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.opacity})`);
            gradient.addColorStop(0.45, `rgba(190, 230, 255, ${bubble.opacity * 0.7})`);
            gradient.addColorStop(1, `rgba(120, 180, 255, ${Math.max(0, bubble.opacity * 0.2)})`);

            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = `rgba(140, 200, 255, ${bubble.opacity * 0.35})`;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new WaterBubbleEffect();
        });
    } else {
        new WaterBubbleEffect();
    }
})();
