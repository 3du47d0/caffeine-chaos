import { GameState, Enemy, Particle, Pickup, Projectile, Room, Wall, Boss } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants';
import { getFloorTheme, FloorTheme } from './floors';

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

function drawFloor(ctx: CanvasRenderingContext2D, theme: FloorTheme, isSecret?: boolean) {
  ctx.fillStyle = isSecret ? '#1A0520' : theme.floorColor;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = isSecret ? '#250830' : theme.floorTileColor;
  for (let x = 0; x < CANVAS_WIDTH; x += 32) {
    for (let y = 0; y < CANVAS_HEIGHT; y += 32) {
      if ((x / 32 + y / 32) % 2 === 0) ctx.fillRect(x + 1, y + 1, 30, 30);
    }
  }

  // Floor-specific decorations
  if (theme.id === 'cold_storage') {
    // Frost sparkles
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#87CEEB';
    const t = _frameTime / 2000;
    for (let i = 0; i < 8; i++) {
      const fx = ((i * 137 + t * 50) % CANVAS_WIDTH);
      const fy = ((i * 211 + t * 30) % CANVAS_HEIGHT);
      ctx.beginPath();
      ctx.arc(fx, fy, 3 + Math.sin(t + i) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (theme.id === 'roast_furnace') {
    // Heat shimmer / ember glow at edges
    ctx.globalAlpha = 0.08;
    const grad = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 100, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 400);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, '#FF4500');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, room: Room, theme: FloorTheme) {
  const margin = 40;
  const isSecret = room.isSecretBossRoom;
  const wallColor = isSecret ? '#3D0050' : theme.wallColor;
  const highlightColor = isSecret ? '#6B0090' : theme.wallHighlight;
  
  drawPixelRect(ctx, 0, 0, CANVAS_WIDTH, margin, wallColor);
  drawPixelRect(ctx, 0, CANVAS_HEIGHT - margin, CANVAS_WIDTH, margin, wallColor);
  drawPixelRect(ctx, 0, 0, margin, CANVAS_HEIGHT, wallColor);
  drawPixelRect(ctx, CANVAS_WIDTH - margin, 0, margin, CANVAS_HEIGHT, wallColor);
  ctx.fillStyle = highlightColor;
  ctx.fillRect(0, margin - 4, CANVAS_WIDTH, 4);
  ctx.fillRect(margin - 4, 0, 4, CANVAS_HEIGHT);
  for (const wall of room.walls) {
    drawPixelRect(ctx, wall.x, wall.y, wall.w, wall.h, wallColor);
    ctx.fillStyle = highlightColor;
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

  if (player.shield) {
    const t = _frameTime / 300;
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
  const isMiniBoss = (enemy as any).isMiniBoss;

  // Mini-boss aura
  if (isMiniBoss) {
    const t = _frameTime / 300;
    ctx.globalAlpha = 0.25 + Math.sin(t) * 0.1;
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

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
    drawPixelRect(ctx, barX, barY, barW * (hp / maxHp), barH, isMiniBoss ? '#FF4444' : '#C0392B');
    if (isMiniBoss) {
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('★ MINI-CHEFE', pos.x, barY - 4);
    }
  }
}

function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss) {
  const { pos, size, type, hp, maxHp, angle } = boss;
  const t = _frameTime / 300;

  if (type === 'steam_king' && boss.invisibleTimer > 0) {
    ctx.globalAlpha = 0.2 + Math.sin(t * 3) * 0.1;
  }

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + size * 0.9, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(pos.x, pos.y);

  switch (type) {
    case 'grinder': {
      ctx.rotate(angle * 2);
      ctx.fillStyle = '#8B7355';
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctx.fillStyle = '#555';
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(-4, -size, 8, size * 0.55);
        ctx.restore();
      }
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#C00';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'steam_king': {
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
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-size * 0.5, -size - 10, size, 12);
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, -size - 10);
      ctx.lineTo(-size * 0.3, -size - 20);
      ctx.lineTo(0, -size - 10);
      ctx.lineTo(size * 0.3, -size - 20);
      ctx.lineTo(size * 0.5, -size - 10);
      ctx.fill();
      drawPixelCircle(ctx, -10, -6, 5, '#555');
      drawPixelCircle(ctx, 10, -6, 5, '#555');
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
      ctx.fillStyle = '#4A3728';
      ctx.beginPath();
      ctx.ellipse(0, 8, size * 0.85, size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5C3D2E';
      ctx.fillRect(-size * 0.75, -size * 0.4, size * 1.5, size * 0.8);
      ctx.fillStyle = '#4A3728';
      ctx.fillRect(-size * 0.75, size * 0.4, size * 1.5, size * 0.2);
      ctx.fillStyle = '#3D2B1F';
      ctx.fillRect(size * 0.6, -size * 0.2, size * 0.4, size * 0.3);
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(0, -size * 0.35, size * 0.65, Math.PI, 0);
      ctx.fill();
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
      drawPixelCircle(ctx, -10, -size * 0.1, 4, '#2C1810');
      drawPixelCircle(ctx, 10, -size * 0.1, 4, '#2C1810');
      ctx.strokeStyle = '#2C1810';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, size * 0.15); ctx.quadraticCurveTo(0, size * 0.25, 8, size * 0.15);
      ctx.stroke();
      break;
    }
    case 'secret_boss': {
      const hpRatio = hp / maxHp;
      const pulse = 1 + Math.sin(t * 2) * 0.05;
      
      ctx.globalAlpha = 0.3 + Math.sin(t) * 0.1;
      const grad = ctx.createRadialGradient(0, 0, size * 0.5, 0, 0, size * 1.5 * pulse);
      grad.addColorStop(0, hpRatio < 0.4 ? '#FF0040' : '#8B00FF');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = hpRatio < 0.4 ? '#4A0020' : '#2D1B4E';
      ctx.beginPath();
      ctx.arc(0, 0, size * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = hpRatio < 0.4 ? '#FF0040' : '#6B00B0';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.6 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 5; i++) {
        const ca = (Math.PI * 2 * i) / 5 + angle;
        const cx = Math.cos(ca) * (size * 0.8);
        const cy = Math.sin(ca) * (size * 0.8) - size * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx - 5, cy + 4);
        ctx.lineTo(cx + 5, cy + 4);
        ctx.fill();
      }

      const eyeColor = hpRatio < 0.4 ? '#FF0000' : '#FFD700';
      drawPixelCircle(ctx, -12, -8, 5, eyeColor);
      drawPixelCircle(ctx, 12, -8, 5, eyeColor);
      drawPixelCircle(ctx, -12, -8, 2, '#FFF');
      drawPixelCircle(ctx, 12, -8, 2, '#FFF');

      for (let i = 0; i < 4; i++) {
        const oa = t * 2 + (Math.PI * 2 * i) / 4;
        const ox = Math.cos(oa) * (size + 15);
        const oy = Math.sin(oa) * (size + 15);
        ctx.globalAlpha = 0.7;
        drawPixelCircle(ctx, ox, oy, 4, '#FFD700');
        ctx.globalAlpha = 1;
      }
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

  const bossNames: Record<string, string> = {
    grinder: '⚙ O GRANDE MOEDOR',
    steam_king: '☁ REI DO VAPOR',
    overflowing_pot: '🍵 BULE TRANSBORDANTE',
    secret_boss: '👑 O SUPREMO EXPRESSO',
  };
  ctx.fillStyle = type === 'secret_boss' ? '#FF00FF' : '#FFD700';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(bossNames[type] || 'BOSS', pos.x, barY - 6);
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  if (proj.isBurnZone) {
    const t = _frameTime / 200;
    const alpha = (0.3 + Math.sin(t) * 0.1) * (proj.lifetime / 120);
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(proj.pos.x, proj.pos.y, 4, proj.pos.x, proj.pos.y, proj.size);
    if (proj.isVortex) {
      grad.addColorStop(0, '#8B00FF');
      grad.addColorStop(0.5, '#FF00FF');
      grad.addColorStop(1, 'transparent');
    } else {
      grad.addColorStop(0, '#FF6B35');
      grad.addColorStop(0.5, '#FFD700');
      grad.addColorStop(1, 'transparent');
    }
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
  const bob = Math.sin(_frameTime / 300) * 3;

  if (type === 'health') {
    ctx.fillStyle = '#FFF';
    drawPixelRect(ctx, pos.x - 8, pos.y - 6 + bob, 16, 12, '#FFF');
    ctx.fillStyle = '#5C3D2E';
    drawPixelRect(ctx, pos.x - 6, pos.y - 4 + bob, 12, 5, '#5C3D2E');
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    const t = _frameTime / 200;
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
    ctx.globalAlpha = 0.3 + Math.sin(_frameTime / 200) * 0.1;
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
    const isSecret = state.rooms[i].isSecretBossRoom;
    const isShop = state.rooms[i].isShopRoom;
    const color = i === state.currentRoom
      ? COLORS.player
      : state.rooms[i].cleared
      ? COLORS.door
      : isSecret
      ? '#8B00FF'
      : isBossRoom
      ? '#C0392B'
      : isShop
      ? '#4CAF50'
      : COLORS.doorLocked;
    drawPixelRect(ctx, rx, ry, roomSize, roomSize, color);
    if (isBossRoom) {
      ctx.fillStyle = '#FFF';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isSecret ? '★' : '!', rx + roomSize / 2, ry + roomSize - 2);
    } else if (isShop) {
      ctx.fillStyle = '#FFF';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('$', rx + roomSize / 2, ry + roomSize - 2);
    }
  }
}

function drawExitPortal(ctx: CanvasRenderingContext2D, state: GameState) {
  const portal = state.exitPortal;
  if (portal?.active) {
    drawPortal(ctx, portal.pos.x, portal.pos.y, portal.type || 'normal');
  }
  const secret = state.secretPortal;
  if (secret?.active) {
    drawPortal(ctx, secret.pos.x, secret.pos.y, 'secret');
  }
  const reward = state.rewardPortal;
  if (reward?.active) {
    drawPortal(ctx, reward.pos.x, reward.pos.y, 'reward');
  }
}

function drawPortal(ctx: CanvasRenderingContext2D, x: number, y: number, type: string) {
  const t = Date.now() / 400;
  const pulse = 1 + Math.sin(t) * 0.15;

  if (type === 'reward') {
    ctx.globalAlpha = 0.3 + Math.sin(t) * 0.1;
    drawPixelCircle(ctx, x, y, 34 * pulse, '#AA44FF');
    ctx.globalAlpha = 0.5;
    drawPixelCircle(ctx, x, y, 22 * pulse, '#FFD700');
    ctx.globalAlpha = 1;
    drawPixelCircle(ctx, x, y, 12, '#FFD700');

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🌀 PORTAL', x, y - 36);
    ctx.fillText('MISTERIOSO', x, y - 26);
  } else if (type === 'secret') {
    ctx.globalAlpha = 0.3 + Math.sin(t) * 0.1;
    drawPixelCircle(ctx, x, y, 36 * pulse, '#8B00FF');
    ctx.globalAlpha = 0.5;
    drawPixelCircle(ctx, x, y, 24 * pulse, '#FF00FF');
    ctx.globalAlpha = 1;
    drawPixelCircle(ctx, x, y, 14, '#EE82EE');

    ctx.fillStyle = '#FF00FF';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚔ DESAFIO', x, y - 38);
    ctx.fillText('SECRETO', x, y - 28);
  } else if (type === 'finish') {
    ctx.globalAlpha = 0.3 + Math.sin(t) * 0.1;
    drawPixelCircle(ctx, x, y, 32 * pulse, '#00CC00');
    ctx.globalAlpha = 0.5;
    drawPixelCircle(ctx, x, y, 22 * pulse, '#00FF00');
    ctx.globalAlpha = 1;
    drawPixelCircle(ctx, x, y, 14, '#90EE90');

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🏠 TERMINAR', x, y - 36);
  } else {
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
    if (target) {
      const theme = getFloorTheme(target.floor);
      ctx.fillText(theme.label, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
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

function drawRestartIndicator(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.restartHoldTimer <= 0) return;
  const RESTART_FRAMES = 90; // 1.5 seconds at 60fps
  const progress = Math.min(1, state.restartHoldTimer / RESTART_FRAMES);
  
  // Screen darkening
  ctx.fillStyle = `rgba(0, 0, 0, ${progress * 0.5})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Circular progress indicator
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2 - 20;
  const radius = 28;

  // Background circle
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Progress arc
  ctx.strokeStyle = progress < 0.8 ? '#FFD700' : '#FF4444';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();

  // Icon
  ctx.globalAlpha = 0.6 + progress * 0.4;
  ctx.fillStyle = '#FFF';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔄', cx, cy);
  ctx.globalAlpha = 1;

  // Text
  ctx.fillStyle = progress < 0.8 ? '#FFD700' : '#FF4444';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('REINICIANDO...', cx, cy + radius + 20);
  ctx.font = '9px monospace';
  ctx.fillStyle = '#FFF';
  ctx.fillText('Solte R para cancelar', cx, cy + radius + 34);
}

// Cached time value for current frame — avoids multiple Date.now() calls
let _frameTime = 0;

export function getFrameTime(): number { return _frameTime; }

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  // Cache Date.now() once per frame for all draw functions
  _frameTime = Date.now();

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
  const isSecret = room.isSecretBossRoom;
  const theme = state._cache?.floorTheme || getFloorTheme(state.floor);

  drawFloor(ctx, theme, isSecret);
  drawWalls(ctx, room, theme);
  drawDoors(ctx, room);

  // Batch: draw all pickups
  for (let i = 0; i < room.pickups.length; i++) drawPickup(ctx, room.pickups[i]);
  drawExitPortal(ctx, state);

  // Batch: draw all projectiles
  for (let i = 0; i < state.projectiles.length; i++) drawProjectile(ctx, state.projectiles[i]);

  // Batch: draw all enemies
  for (let i = 0; i < room.enemies.length; i++) drawEnemy(ctx, room.enemies[i]);
  if (room.boss && room.boss.hp > 0) drawBoss(ctx, room.boss);

  drawParticles(ctx, state.particles);
  drawPlayer(ctx, state);
  drawMinimap(ctx, state);

  ctx.fillStyle = '#FFF';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Sala ${state.currentRoom + 1}/${state.rooms.length}`, 50, 25);
  ctx.fillText(`${theme.label}`, 50, 42);

  drawClearMessage(ctx, state);
  drawFastBrew(ctx, state);
  drawRunTimer(ctx, state);
  drawTransitionFade(ctx, state);
  drawRestartIndicator(ctx, state);

  ctx.restore();
}
