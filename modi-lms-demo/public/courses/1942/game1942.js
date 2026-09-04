export class Game1942 {
  constructor(canvas) {
    if (!canvas || typeof canvas.getContext !== 'function') {
      throw new TypeError('Game1942 requires a canvas element');
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) throw new Error('Canvas 2D rendering is unavailable');

    this.running = false;
    this.frameId = null;
    this.lastTime = 0;
    this.keys = new Set();
    this.hardware = { x: 0, y: 0 };
    this.horizontalCalibration = null;
    this.lastAttack = false;
    this.boundKeyDown = (event) => this.onKeyDown(event);
    this.boundKeyUp = (event) => this.onKeyUp(event);
    this.boundPointerDown = () => {
      if (this.gameOver) this.reset();
    };
    this.reset();
  }

  reset() {
    const w = this.canvas.width || 720;
    const h = this.canvas.height || 420;
    this.ship = { x: w / 2, y: h - 45, width: 25, height: 29, speed: 255, cooldown: 0 };
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.spawnTimer = 0.35;
    this.elapsed = 0;
    this.gameOver = false;
    this.invulnerable = 0;
    this.lastAttack = false;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = 0;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    this.canvas.addEventListener('pointerdown', this.boundPointerDown);
    this.frameId = requestAnimationFrame((time) => this.draw(time));
  }

  apply(result = {}) {
    if (!result || typeof result !== 'object') return;
    const movement = result.movement || {};
    let x = Number(movement.x);
    let y = Number(movement.y);
    const controls = result.controls || {};
    if (this.horizontalCalibration) {
      const raw = Number(controls[this.horizontalCalibration.axis]);
      if (Number.isFinite(raw)) {
        const { neutral, sign, range } = this.horizontalCalibration;
        x = ((raw - neutral) * sign) / range;
      }
      const verticalAxis = this.horizontalCalibration.axis === 'roll' ? 'pitch' : 'roll';
      const verticalRaw = Number(controls[verticalAxis]);
      if (Number.isFinite(verticalRaw)) {
        y = -(verticalRaw - this.horizontalCalibration.crossNeutral) / 90;
      }
    }
    this.hardware.x = Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0;
    this.hardware.y = Number.isFinite(y) ? Math.max(-1, Math.min(1, y)) : 0;

    const attacking = Boolean(result.attack);
    if (attacking && !this.lastAttack) {
      if (this.gameOver) this.reset();
      else this.fire();
    }
    this.lastAttack = attacking;
  }

  setHorizontalCalibration(calibration) {
    if (!calibration || !['pitch', 'roll'].includes(calibration.axis)) {
      throw new TypeError('Horizontal calibration requires a pitch or roll axis');
    }
    const neutral = Number(calibration.neutral);
    const sign = Number(calibration.sign);
    const range = Number(calibration.range);
    const crossNeutral = Number(calibration.crossNeutral ?? 0);
    if (![neutral, sign, range, crossNeutral].every(Number.isFinite) || !sign || range <= 0) {
      throw new TypeError('Horizontal calibration values must be finite');
    }
    this.horizontalCalibration = {
      axis: calibration.axis,
      neutral,
      sign: sign < 0 ? -1 : 1,
      range: Math.max(8, Math.abs(range)),
      crossNeutral
    };
    this.hardware.x = 0;
  }

  clearHorizontalCalibration() {
    this.horizontalCalibration = null;
    this.hardware.x = 0;
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'w', 'a', 's', 'd', 'r', 'enter'].includes(key)) {
      event.preventDefault();
    }
    if (this.gameOver && (key === 'r' || key === 'enter' || key === ' ')) {
      this.reset();
      return;
    }
    this.keys.add(key);
    if ((key === ' ' || key === 'z') && !event.repeat) this.fire();
  }

  onKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }

  fire() {
    if (this.gameOver || this.ship.cooldown > 0) return;
    this.ship.cooldown = 0.16;
    this.bullets.push({ x: this.ship.x - 8, y: this.ship.y - 17, width: 4, height: 12, speed: 430 });
    this.bullets.push({ x: this.ship.x + 8, y: this.ship.y - 17, width: 4, height: 12, speed: 430 });
  }

  update(dt) {
    if (this.gameOver) return;
    this.elapsed += dt;
    this.level = 1 + Math.floor(this.score / 1000);
    this.ship.cooldown = Math.max(0, this.ship.cooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);

    let dx = this.hardware.x;
    let dy = this.hardware.y;
    if (this.keys.has('arrowleft') || this.keys.has('a')) dx -= 1;
    if (this.keys.has('arrowright') || this.keys.has('d')) dx += 1;
    if (this.keys.has('arrowup') || this.keys.has('w')) dy -= 1;
    if (this.keys.has('arrowdown') || this.keys.has('s')) dy += 1;
    const length = Math.hypot(dx, dy) || 1;
    if (length > 1) { dx /= length; dy /= length; }
    this.ship.x += dx * this.ship.speed * dt;
    this.ship.y += dy * this.ship.speed * dt;
    this.ship.x = Math.max(18, Math.min(this.canvas.width - 18, this.ship.x));
    this.ship.y = Math.max(24, Math.min(this.canvas.height - 20, this.ship.y));

    if (this.keys.has(' ') || this.keys.has('z')) this.fire();

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(0.28, 0.92 - this.level * 0.055) * (0.75 + Math.random() * 0.5);
    }

    for (const bullet of this.bullets) bullet.y -= bullet.speed * dt;
    for (const enemy of this.enemies) {
      enemy.y += enemy.speed * dt;
      enemy.x += Math.sin(this.elapsed * enemy.swaySpeed + enemy.phase) * enemy.sway * dt;
    }
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
    }

    this.handleCollisions();
    this.bullets = this.bullets.filter((bullet) => bullet.y + bullet.height > 0 && !bullet.dead);
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.dead) return false;
      if (enemy.y - enemy.height / 2 > this.canvas.height) {
        this.loseLife();
        return false;
      }
      return true;
    });
    this.particles = this.particles.filter((particle) => particle.life > 0);
  }

  spawnEnemy() {
    const size = 22 + Math.random() * 12;
    this.enemies.push({
      x: size + Math.random() * Math.max(1, this.canvas.width - size * 2),
      y: -size,
      width: size,
      height: size * 0.82,
      speed: 70 + this.level * 9 + Math.random() * 45,
      sway: 12 + Math.random() * 25,
      swaySpeed: 1.8 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
      dead: false
    });
  }

  handleCollisions() {
    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      for (const bullet of this.bullets) {
        if (!bullet.dead && this.overlap(bullet, enemy)) {
          bullet.dead = true;
          enemy.dead = true;
          this.score += 100;
          this.explode(enemy.x, enemy.y, '#ffb347');
          break;
        }
      }
      if (!enemy.dead && this.invulnerable <= 0 && this.overlap(this.ship, enemy)) {
        enemy.dead = true;
        this.explode(enemy.x, enemy.y, '#ff5b45');
        this.loseLife();
      }
    }
  }

  overlap(a, b) {
    return Math.abs(a.x - b.x) * 2 < a.width + b.width &&
      Math.abs(a.y - b.y) * 2 < a.height + b.height;
  }

  loseLife() {
    if (this.gameOver || this.invulnerable > 0) return;
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.gameOver = true;
      this.explode(this.ship.x, this.ship.y, '#d8ff69', 24);
    } else {
      this.invulnerable = 1.6;
      this.ship.x = this.canvas.width / 2;
      this.ship.y = this.canvas.height - 45;
    }
  }

  explode(x, y, color, count = 12) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 35 + Math.random() * 100;
      this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.35 + Math.random() * 0.45, color });
    }
  }

  draw(time = 0) {
    if (!this.running) return;
    const dt = this.lastTime ? Math.min(0.05, (time - this.lastTime) / 1000) : 0;
    this.lastTime = time;
    this.update(dt);
    this.render();
    this.frameId = requestAnimationFrame((nextTime) => this.draw(nextTime));
  }

  render() {
    const c = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const gradient = c.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#06182f');
    gradient.addColorStop(1, '#0a3550');
    c.fillStyle = gradient;
    c.fillRect(0, 0, w, h);

    c.fillStyle = 'rgba(180,225,255,.65)';
    for (let i = 0; i < 42; i += 1) {
      const x = (i * 83 + 17) % Math.max(1, w);
      const y = (i * 47 + this.elapsed * (18 + i % 4) * 6) % Math.max(1, h);
      c.fillRect(x, y, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 4 : 2);
    }

    for (const enemy of this.enemies) this.drawEnemy(enemy);
    c.fillStyle = '#ffe665';
    for (const bullet of this.bullets) c.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
    for (const particle of this.particles) {
      c.globalAlpha = Math.min(1, particle.life * 2.5);
      c.fillStyle = particle.color;
      c.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    }
    c.globalAlpha = 1;

    if (!this.gameOver && (this.invulnerable <= 0 || Math.floor(this.invulnerable * 12) % 2 === 0)) this.drawShip();
    this.drawHud();
    if (this.gameOver) this.drawGameOver();
  }

  drawShip() {
    const c = this.ctx;
    const { x, y } = this.ship;
    c.fillStyle = '#d8ff69';
    c.beginPath();
    c.moveTo(x, y - 18);
    c.lineTo(x - 7, y + 2);
    c.lineTo(x - 16, y + 12);
    c.lineTo(x - 5, y + 9);
    c.lineTo(x, y + 15);
    c.lineTo(x + 5, y + 9);
    c.lineTo(x + 16, y + 12);
    c.lineTo(x + 7, y + 2);
    c.closePath();
    c.fill();
    c.fillStyle = '#4cc9ff';
    c.fillRect(x - 2, y - 8, 4, 10);
  }

  drawEnemy(enemy) {
    const c = this.ctx;
    c.save();
    c.translate(enemy.x, enemy.y);
    c.fillStyle = '#ff684f';
    c.beginPath();
    c.moveTo(0, enemy.height / 2);
    c.lineTo(-enemy.width / 2, -enemy.height / 3);
    c.lineTo(-6, -enemy.height / 5);
    c.lineTo(0, -enemy.height / 2);
    c.lineTo(6, -enemy.height / 5);
    c.lineTo(enemy.width / 2, -enemy.height / 3);
    c.closePath();
    c.fill();
    c.fillStyle = '#ffd166';
    c.fillRect(-3, -4, 6, 9);
    c.restore();
  }

  drawHud() {
    const c = this.ctx;
    c.fillStyle = 'rgba(3,12,25,.62)';
    c.fillRect(0, 0, this.canvas.width, 36);
    c.fillStyle = '#eaf7ff';
    c.font = 'bold 16px system-ui, sans-serif';
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText(`SCORE ${String(this.score).padStart(6, '0')}`, 14, 18);
    c.textAlign = 'center';
    c.fillText(`LEVEL ${this.level}`, this.canvas.width / 2, 18);
    c.textAlign = 'right';
    c.fillText(`LIVES ${this.lives}`, this.canvas.width - 14, 18);
  }

  drawGameOver() {
    const c = this.ctx;
    c.fillStyle = 'rgba(1,8,18,.78)';
    c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    c.textAlign = 'center';
    c.fillStyle = '#ff755e';
    c.font = 'bold 42px system-ui, sans-serif';
    c.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
    c.fillStyle = '#f4fbff';
    c.font = 'bold 18px system-ui, sans-serif';
    c.fillText(`FINAL SCORE ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 12);
    c.font = '14px system-ui, sans-serif';
    c.fillText('Press Enter, Space, R, Attack, or tap to restart', this.canvas.width / 2, this.canvas.height / 2 + 48);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.lastTime = 0;
    this.keys.clear();
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
  }
}
