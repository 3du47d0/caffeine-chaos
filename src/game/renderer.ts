import { GameState, Enemy, Particle, Pickup, Projectile, Room, Wall, Boss } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants';

function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function drawPixelCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(Math.floor(x), Math.floor(y), Math.floor(r), 0, Math.PI * 2);
  ctx.fill();
}

function drawFloor(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = COLORS.floorTile;
  for (let x = 0; x < CANVAS_WIDTH; x += 32) {
    for (let y = 0; y < CANVAS_HEIGHT; y += 32) {
      if ((x / 32 + y / 32) % 2 === 0) ctx.fillRect(x + 1, y + 1, 30, 30);
    }
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, room: Room) {
  const margin = 40;
  drawPixelRect(ctx, 0, 0, CANVAS_WIDTH, margin, COLORS.wall);
  drawPixelRect(ctx, 0, CANVAS_HEIGHT - margin, CANVAS_WIDTH, margin, COLORS.wall);
  drawPixelRect(ctx, 0, 0, margin, CANVAS_HEIGHT, COLORS.wall);
  drawPixelRect(ctx, CANVAS_WIDTH - margin, 0, margin, CANVAS_HEIGHT, COLORS.wall);
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(0, margin - 4, CANVAS_WIDTH, 4);
  ctx.fillRect(margin - 4, 0, 4, CANVAS_HEIGHT);
  for (const wall of room.walls) {
    drawPixelRect(ctx, wall.x, wall.y, wall.w, wall.h, COLORS.wall);
    ctx.fillStyle = COLORS.wallHighlight;
    ctx.fillRect(wall.x, wall.y, wall.w, 3);
    ctx.fillRect(wall.x, wall.y, 3, wall.h);
  }
}

function drawDoors(ctx: CanvasRenderingContext2D, room: Room) {
  for (const door of room.doors) {
    const color = room.cleared ? COLORS.door : COLORS.doorLocked;
    const s = 20;
    drawPixelRect(ctx, door.pos.x - s, door.pos.y - s / 2, s * 2, s, color);
    if (room.cleared) {
      ctx.fillStyle = '#FFF';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      const arrow = door.direction === 'north' ? '▲' : door.direction === 'south' ? '▼' : door.direction === 'east' ? '▶' : '◀';
      ctx.fillText(arrow, door.pos.x, door.pos.y + 5);
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
  const { player } = state;
  const flash = player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 3) % 2 === 0;
  if (flash) return;

  const x = player.pos.x;
  const y = player.pos.y;
  const s = player.size;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.8, s * 0.7, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPixelCircle(ctx, x, y, s, COLORS.player);
  ctx.strokeStyle = COLORS.playerOutline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.stroke();

  const eyeOffset = 6;
  const ex = x + player.facing.x * eyeOffset;
  const ey = y + player.facing.y * eyeOffset;
  drawPixelCircle(ctx, ex - 4, ey - 2, 3, '#2C1810');
  drawPixelCircle(ctx, ex + 4, ey - 2, 3, '#2C1810');

  ctx.fillStyle = '#FFF';
  ctx.fillRect(x - 10, y - s - 6, 20, 8);
  ctx.fillRect(x - 6, y - s - 12, 12, 8);

  if (player.dashTimer > 0) {
    ctx.strokeStyle = COLORS.dash;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, s + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Shield ring
  if (player.shield) {
    const t = Date.now() / 300;
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.7 + Math.sin(t) * 0.2;
    ctx.beginPath();
    ctx.arc(x, y, s + 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { pos, size, type, hp, maxHp } = enemy;

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + size * 0.8, size * 0.6, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (type) {
    case 'croissant':
      ctx.fillStyle = '#D4A03A';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0.3, Math.PI * 2 - 0.3);
      ctx.fill();
      ctx.fillStyle = '#B8860B';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#D4A03A';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 0.35, 0, Math.PI * 2);
      ctx.fill();
      drawPixelCircle(ctx, pos.x - 5, pos.y - 3, 2, '#800');
      drawPixelCircle(ctx, pos.x + 5, pos.y - 3, 2, '#800');
      break;
    case 'angry_cup':
      drawPixelRect(ctx, pos.x - size * 0.6, pos.y - size * 0.8, size * 1.2, size * 1.6, '#F5F5DC');
      ctx.fillStyle = '#5C3D2E';
      drawPixelRect(ctx, pos.x - size * 0.5, pos.y - size * 0.6, size, size * 0.5, '#5C3D2E');
      ctx.strokeStyle = '#F5F5DC';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pos.x + size * 0.7, pos.y, size * 0.3, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      drawPixelRect(ctx, pos.x - 6, pos.y + 2, 4, 4, '#800');
      drawPixelRect(ctx, pos.x + 2, pos.y + 2, 4, 4, '#800');
      drawPixelRect(ctx, pos.x - 4, pos.y + 10, 8, 2, '#800');
      break;
    case 'milk_blob':
      ctx.fillStyle = '#F5F5DC';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E8E0D0';
      ctx.beginPath();
      ctx.arc(pos.x - 3, pos.y - 3, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      drawPixelCircle(ctx, pos.x - 4, pos.y - 2, 2, '#666');
      drawPixelCircle(ctx, pos.x + 4, pos.y - 2, 2, '#666');
      break;
    case 'drone':
      drawPixelRect(ctx, pos.x - size, pos.y - size * 0.5, size * 2, size, '#708090');
      drawPixelRect(ctx, pos.x - size * 0.4, pos.y - size * 0.3, size * 0.8, size * 0.6, '#505050');
      ctx.fillStyle = '#888';
      drawPixelRect(ctx, pos.x - size * 1.2, pos.y - 2, size * 0.4, 4, '#888');
      drawPixelRect(ctx, pos.x + size * 0.8, pos.y - 2, size * 0.4, 4, '#888');
      drawPixelCircle(ctx, pos.x, pos.y, 3, '#F00');
      break;
  }

  if (hp < maxHp) {
    const barW = size * 2;
    const barH = 4;
    const barX = pos.x - barW / 2;
    const barY = pos.y - size - 12;
    drawPixelRect(ctx, barX, barY, barW, barH, COLORS.healthEmpty);
    drawPixelRect(ctx, barX, barY, barW * (hp / maxHp), barH, '#C0392B');
  }
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
  const { pos, size, type, hp, maxHp, angle } = boss;
  const t = Date.now() / 300;

  // Invisible steam king
  if (type === 'steam_king' && boss.invisibleTimer > 0) {
    ctx.globalAlpha = 0.2 + Math.sin(t * 3) * 0.1;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + size * 0.9, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(pos.x, pos.y);

  switch (type) {
    case 'grinder': {
      // Rotating grinder body
      ctx.rotate(angle * 2);
      ctx.fillStyle = '#8B7355';
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      // Grinder blades
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctx.fillStyle = '#555';
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(-4, -size, 8, size * 0.55);
        ctx.restore();
      }
      // Center knob
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      // Angry eye
      ctx.fillStyle = '#C00';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'steam_king': {
      // Fluffy cloud shape
      ctx.fillStyle = '#E0E0E0';
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#C8C8C8';
      ctx.beginPath();
      ctx.arc(-size * 0.4, -size * 0.2, size * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(size * 0.4, -size * 0.2, size * 0.65, 0, Math.PI * 2);
      ctx.fill();
      // Crown
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-size * 0.5, -size - 10, size, 12);
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size - 10);
      ctx.lineTo(-size * 0.3, -size - 20);
      ctx.lineTo(0, -size - 10);
      ctx.lineTo(size * 0.3, -size - 20);
      ctx.lineTo(size * 0.5, -size - 10);
      ctx.fill();
      // Eyes
      drawPixelCircle(ctx, -10, -6, 5, '#555');
      drawPixelCircle(ctx, 10, -6, 5, '#555');
      // Angry brows
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-16, -14); ctx.lineTo(-5, -11);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(16, -14); ctx.lineTo(5, -11);
      ctx.stroke();
      break;
    }
    case 'overflowing_pot': {
      // Big round pot
      ctx.fillStyle = '#4A3728';
      ctx.beginPath();
      ctx.ellipse(0, 8, size * 0.85, size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pot body
      ctx.fillStyle = '#5C3D2E';
      ctx.fillRect(-size * 0.75, -size * 0.4, size * 1.5, size * 0.8);
      ctx.fillStyle = '#4A3728';
      ctx.fillRect(-size * 0.75, size * 0.4, size * 1.5, size * 0.2);
      // Spout
      ctx.fillStyle = '#3D2B1F';
      ctx.fillRect(size * 0.6, -size * 0.2, size * 0.4, size * 0.3);
      // Overflowing coffee
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(0, -size * 0.35, size * 0.65, Math.PI, 0);
      ctx.fill();
      // Bubbles
      for (let i = 0; i < 3; i++) {
        const bx = (i - 1) * size * 0.4;
        const by = -size * 0.5 - Math.sin(t + i) * 8;
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#D4A03A';
        ctx.beginPath();
        ctx.arc(bx, by, 5 + Math.sin(t * 2 + i) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // Face
      drawPixelCircle(ctx, -10, -size * 0.1, 4, '#2C1810');
      drawPixelCircle(ctx, 10, -size * 0.1, 4, '#2C1810');
      ctx.strokeStyle = '#2C1810';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, size * 0.15); ctx.quadraticCurveTo(0, size * 0.25, 8, size * 0.15);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;

  // Boss HP bar
  const barW = size * 3;
  const barH = 8;
  const barX = pos.x - barW / 2;
  const barY = pos.y - size - 22;
  drawPixelRect(ctx, barX - 2, barY - 2, barW + 4, barH + 4, '#1A0A00');
  drawPixelRect(ctx, barX, barY, barW, barH, COLORS.healthEmpty);
  const hpRatio = Math.max(0, hp / maxHp);
  const hpColor = hpRatio > 0.5 ? '#C0392B' : hpRatio > 0.25 ? '#E67E22' : '#FF0000';
  drawPixelRect(ctx, barX, barY, barW * hpRatio, barH, hpColor);

  // Boss name
  const bossNames: Record<string, string> = {
    grinder: '⚙ O GRANDE MOEDOR',
    steam_king: '☁ REI DO VAPOR',
    overflowing_pot: '🍵 BULE TRANSBORDANTE',
  };
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(bossNames[type] || 'BOSS', pos.x, barY - 6);
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  if (proj.isBurnZone) {
    // Draw steam/burn zone
    const t = Date.now() / 200;
    const alpha = (0.3 + Math.sin(t) * 0.1) * (proj.lifetime / 120);
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(proj.pos.x, proj.pos.y, 4, proj.pos.x, proj.pos.y, proj.size);
    grad.addColorStop(0, '#FF6B35');
    grad.addColorStop(0.5, '#FFD700');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(proj.pos.x, proj.pos.y, proj.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  const color = proj.friendly ? COLORS.bean : '#C0392B';
  drawPixelCircle(ctx, proj.pos.x, proj.pos.y, proj.size, color);
  if (proj.friendly) {
    ctx.strokeStyle = '#3D2B1F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(proj.pos.x, proj.pos.y - proj.size * 0.6);
    ctx.lineTo(proj.pos.x, proj.pos.y + proj.size * 0.6);
    ctx.stroke();
  }
}

function drawPickup(ctx: CanvasRenderingContext2D, pickup: Pickup) {
  const { pos, type } = pickup;
  const bob = Math.sin(Date.now() / 300) * 3;

  if (type === 'health') {
    ctx.fillStyle = '#FFF';
    drawPixelRect(ctx, pos.x - 8, pos.y - 6 + bob, 16, 12, '#FFF');
    ctx.fillStyle = '#5C3D2E';
    drawPixelRect(ctx, pos.x - 6, pos.y - 4 + bob, 12, 5, '#5C3D2E');
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    const t = Date.now() / 200;
    ctx.beginPath();
    ctx.moveTo(pos.x - 3, pos.y - 8 + bob);
    ctx.quadraticCurveTo(pos.x - 5, pos.y - 14 + bob, pos.x - 2, pos.y - 18 + bob + Math.sin(t) * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x + 3, pos.y - 8 + bob);
    ctx.quadraticCurveTo(pos.x + 5, pos.y - 14 + bob, pos.x + 2, pos.y - 18 + bob + Math.cos(t) * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = COLORS.gold;
    drawPixelCircle(ctx, pos.x, pos.y + bob, 6, COLORS.gold);
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 4 + bob);
    ctx.lineTo(pos.x, pos.y + 4 + bob);
    ctx.stroke();
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;
    drawPixelCircle(ctx, pos.x, pos.y + bob, 10, COLORS.gold);
    ctx.globalAlpha = 1;
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.lifetime / p.maxLifetime;
    ctx.globalAlpha = alpha;
    drawPixelCircle(ctx, p.pos.x, p.pos.y, p.size * alpha, p.color);
  }
  ctx.globalAlpha = 1;
}

function drawMinimap(ctx: CanvasRenderingContext2D, state: GameState) {
  const mmX = CANVAS_WIDTH - 110;
  const mmY = 10;
  const mmW = 100;
  const mmH = 60;
  const roomSize = 12;
  const gap = 2;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(mmX, mmY, mmW, mmH);
  ctx.strokeStyle = COLORS.door;
  ctx.lineWidth = 1;
  ctx.strokeRect(mmX, mmY, mmW, mmH);

  const startX = mmX + 10;
  const startY = mmY + (mmH - roomSize) / 2;

  for (let i = 0; i < state.rooms.length; i++) {
    const rx = startX + i * (roomSize + gap);
    const ry = startY;
    const isBossRoom = state.rooms[i].isBossRoom;
    const color = i === state.currentRoom
      ? COLORS.player
      : state.rooms[i].cleared
      ? COLORS.door
      : isBossRoom
      ? '#C0392B'
      : COLORS.doorLocked;
    drawPixelRect(ctx, rx, ry, roomSize, roomSize, color);
    if (isBossRoom) {
      ctx.fillStyle = '#FFF';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', rx + roomSize / 2, ry + roomSize - 2);
    }
  }
}

function drawExitPortal(ctx: CanvasRenderingContext2D, state: GameState) {
  const portal = state.exitPortal;
  if (!portal || !portal.active) return;

  const { x, y } = portal.pos;
  const t = Date.now() / 400;
  const pulse = 1 + Math.sin(t) * 0.15;

  ctx.globalAlpha = 0.3 + Math.sin(t) * 0.1;
  drawPixelCircle(ctx, x, y, 32 * pulse, '#D4A03A');
  ctx.globalAlpha = 0.5;
  drawPixelCircle(ctx, x, y, 22 * pulse, '#FFD700');
  ctx.globalAlpha = 1;
  drawPixelCircle(ctx, x, y, 14, '#FFF8E1');
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const a = t * 2 + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(x, y, 10, a, a + 1.2);
    ctx.stroke();
  }

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('☕ SAÍDA', x, y - 36);
}

function drawClearMessage(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.clearMessageTimer <= 0) return;
  const alpha = Math.min(1, state.clearMessageTimer / 30);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('☕ CAMINHO LIVRE! ☕', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#FFF';
  ctx.fillText('Encontre o Portal de Vapor', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
}

function drawTransitionFade(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.transitionTimer <= 0) return;
  let alpha: number;
  if (state.transitionTimer > 30) {
    alpha = (60 - state.transitionTimer) / 30;
  } else {
    alpha = state.transitionTimer / 30;
  }
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  if (alpha > 0.5) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    const target = state.transitionTarget;
    const floorLabel = target ? `Andar ${target.floor + 1}` : '';
    ctx.fillText(floorLabel, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.globalAlpha = 1;
  }
}

function formatTime(frames: number): string {
  const totalSeconds = Math.floor(frames / 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function drawRunTimer(ctx: CanvasRenderingContext2D, state: GameState) {
  const timeStr = formatTime(state.runTimer);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(CANVAS_WIDTH / 2 - 50, 4, 100, 22);
  ctx.strokeStyle = '#D4A03A';
  ctx.lineWidth = 1;
  ctx.strokeRect(CANVAS_WIDTH / 2 - 50, 4, 100, 22);
  ctx.fillStyle = '#FFD700';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`⏱ ${timeStr}`, CANVAS_WIDTH / 2, 20);
}

function drawFastBrew(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.fastBrewTimer <= 0) return;
  const alpha = Math.min(1, state.fastBrewTimer / 30);
  const yOffset = (120 - state.fastBrewTimer) * 0.5;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚡ FAST BREW! ⚡', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90 - yOffset);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#FFF';
  ctx.fillText('Café Rápido!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 72 - yOffset);
  ctx.globalAlpha = 1;
}

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();

  if (state.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * state.screenShake * 2;
    const shakeY = (Math.random() - 0.5) * state.screenShake * 2;
    ctx.translate(shakeX, shakeY);
  }

  if (state.damageFlash > 0) {
    ctx.fillStyle = `rgba(200, 0, 0, ${state.damageFlash * 0.05})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const room = state.rooms[state.currentRoom];

  drawFloor(ctx);
  drawWalls(ctx, room);
  drawDoors(ctx, room);

  for (const pickup of room.pickups) drawPickup(ctx, pickup);
  drawExitPortal(ctx, state);

  for (const proj of state.projectiles) drawProjectile(ctx, proj);

  for (const enemy of room.enemies) drawEnemy(ctx, enemy);
  if (room.boss && room.boss.hp > 0) drawBoss(ctx, room.boss);

  drawParticles(ctx, state.particles);
  drawPlayer(ctx, state);
  drawMinimap(ctx, state);

  ctx.fillStyle = '#FFF';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Sala ${state.currentRoom + 1}/${state.rooms.length}`, 50, 25);
  ctx.fillText(`Andar ${state.floor + 1}`, 50, 42);

  drawClearMessage(ctx, state);
  drawFastBrew(ctx, state);
  drawRunTimer(ctx, state);
  drawTransitionFade(ctx, state);

  ctx.restore();
}
