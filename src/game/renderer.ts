import { GameState, Enemy, Particle, Pickup, Projectile, Room, Wall } from './types';
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

  // Tile pattern
  ctx.fillStyle = COLORS.floorTile;
  for (let x = 0; x < CANVAS_WIDTH; x += 32) {
    for (let y = 0; y < CANVAS_HEIGHT; y += 32) {
      if ((x / 32 + y / 32) % 2 === 0) {
        ctx.fillRect(x + 1, y + 1, 30, 30);
      }
    }
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, room: Room) {
  const margin = 40;

  // Border walls
  drawPixelRect(ctx, 0, 0, CANVAS_WIDTH, margin, COLORS.wall);
  drawPixelRect(ctx, 0, CANVAS_HEIGHT - margin, CANVAS_WIDTH, margin, COLORS.wall);
  drawPixelRect(ctx, 0, 0, margin, CANVAS_HEIGHT, COLORS.wall);
  drawPixelRect(ctx, CANVAS_WIDTH - margin, 0, margin, CANVAS_HEIGHT, COLORS.wall);

  // Wall highlights
  ctx.fillStyle = COLORS.wallHighlight;
  ctx.fillRect(0, margin - 4, CANVAS_WIDTH, 4);
  ctx.fillRect(margin - 4, 0, 4, CANVAS_HEIGHT);

  // Internal walls
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
      // Arrow indicator
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

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.8, s * 0.7, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  drawPixelCircle(ctx, x, y, s, COLORS.player);
  // Outline
  ctx.strokeStyle = COLORS.playerOutline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.stroke();

  // Eyes (facing direction)
  const eyeOffset = 6;
  const ex = x + player.facing.x * eyeOffset;
  const ey = y + player.facing.y * eyeOffset;
  drawPixelCircle(ctx, ex - 4, ey - 2, 3, '#2C1810');
  drawPixelCircle(ctx, ex + 4, ey - 2, 3, '#2C1810');

  // Barista hat
  ctx.fillStyle = '#FFF';
  ctx.fillRect(x - 10, y - s - 6, 20, 8);
  ctx.fillRect(x - 6, y - s - 12, 12, 8);

  // Dash indicator
  if (player.dashTimer > 0) {
    ctx.strokeStyle = COLORS.dash;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, s + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { pos, size, type, hp, maxHp } = enemy;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(pos.x, pos.y + size * 0.8, size * 0.6, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (type) {
    case 'croissant':
      // Crescent shape
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
      // Angry eyes
      ctx.fillStyle = '#800';
      drawPixelCircle(ctx, pos.x - 5, pos.y - 3, 2, '#800');
      drawPixelCircle(ctx, pos.x + 5, pos.y - 3, 2, '#800');
      break;

    case 'angry_cup':
      // Cup body
      ctx.fillStyle = '#F5F5DC';
      drawPixelRect(ctx, pos.x - size * 0.6, pos.y - size * 0.8, size * 1.2, size * 1.6, '#F5F5DC');
      // Coffee inside
      ctx.fillStyle = '#5C3D2E';
      drawPixelRect(ctx, pos.x - size * 0.5, pos.y - size * 0.6, size, size * 0.5, '#5C3D2E');
      // Handle
      ctx.strokeStyle = '#F5F5DC';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(pos.x + size * 0.7, pos.y, size * 0.3, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.stroke();
      // Angry face
      ctx.fillStyle = '#800';
      drawPixelRect(ctx, pos.x - 6, pos.y + 2, 4, 4, '#800');
      drawPixelRect(ctx, pos.x + 2, pos.y + 2, 4, 4, '#800');
      // Angry mouth
      drawPixelRect(ctx, pos.x - 4, pos.y + 10, 8, 2, '#800');
      break;

    case 'milk_blob':
      // Blobby shape
      ctx.fillStyle = '#F5F5DC';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#E8E0D0';
      ctx.beginPath();
      ctx.arc(pos.x - 3, pos.y - 3, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      drawPixelCircle(ctx, pos.x - 4, pos.y - 2, 2, '#666');
      drawPixelCircle(ctx, pos.x + 4, pos.y - 2, 2, '#666');
      break;

    case 'drone':
      // Mechanical look
      ctx.fillStyle = '#708090';
      drawPixelRect(ctx, pos.x - size, pos.y - size * 0.5, size * 2, size, '#708090');
      ctx.fillStyle = '#505050';
      drawPixelRect(ctx, pos.x - size * 0.4, pos.y - size * 0.3, size * 0.8, size * 0.6, '#505050');
      // Propellers
      ctx.fillStyle = '#888';
      drawPixelRect(ctx, pos.x - size * 1.2, pos.y - 2, size * 0.4, 4, '#888');
      drawPixelRect(ctx, pos.x + size * 0.8, pos.y - 2, size * 0.4, 4, '#888');
      // Red eye
      drawPixelCircle(ctx, pos.x, pos.y, 3, '#F00');
      break;
  }

  // HP bar
  if (hp < maxHp) {
    const barW = size * 2;
    const barH = 4;
    const barX = pos.x - barW / 2;
    const barY = pos.y - size - 12;
    drawPixelRect(ctx, barX, barY, barW, barH, COLORS.healthEmpty);
    drawPixelRect(ctx, barX, barY, barW * (hp / maxHp), barH, '#C0392B');
  }
}

function drawProjectile(ctx: CanvasRenderingContext2D, proj: Projectile) {
  const color = proj.friendly ? COLORS.bean : '#C0392B';
  drawPixelCircle(ctx, proj.pos.x, proj.pos.y, proj.size, color);
  if (proj.friendly) {
    // Coffee bean look - line through middle
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
    // Espresso cup
    ctx.fillStyle = '#FFF';
    drawPixelRect(ctx, pos.x - 8, pos.y - 6 + bob, 16, 12, '#FFF');
    ctx.fillStyle = '#5C3D2E';
    drawPixelRect(ctx, pos.x - 6, pos.y - 4 + bob, 12, 5, '#5C3D2E');
    // Steam
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
    // Gold bean
    ctx.fillStyle = COLORS.gold;
    drawPixelCircle(ctx, pos.x, pos.y + bob, 6, COLORS.gold);
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 4 + bob);
    ctx.lineTo(pos.x, pos.y + 4 + bob);
    ctx.stroke();
    // Glow
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
    const color = i === state.currentRoom ? COLORS.player : state.rooms[i].cleared ? COLORS.door : COLORS.doorLocked;
    drawPixelRect(ctx, rx, ry, roomSize, roomSize, color);
  }
}

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();

  // Screen shake
  if (state.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * state.screenShake * 2;
    const shakeY = (Math.random() - 0.5) * state.screenShake * 2;
    ctx.translate(shakeX, shakeY);
  }

  // Damage flash
  if (state.damageFlash > 0) {
    ctx.fillStyle = `rgba(200, 0, 0, ${state.damageFlash * 0.05})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const room = state.rooms[state.currentRoom];

  drawFloor(ctx);
  drawWalls(ctx, room);
  drawDoors(ctx, room);

  for (const pickup of room.pickups) {
    drawPickup(ctx, pickup);
  }

  for (const enemy of room.enemies) {
    drawEnemy(ctx, enemy);
  }

  for (const proj of state.projectiles) {
    drawProjectile(ctx, proj);
  }

  drawParticles(ctx, state.particles);
  drawPlayer(ctx, state);
  drawMinimap(ctx, state);

  // Room counter
  ctx.fillStyle = '#FFF';
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Sala ${state.currentRoom + 1}/${state.rooms.length}`, 50, 25);
  ctx.fillText(`Andar ${state.floor + 1}`, 50, 42);

  ctx.restore();
}
