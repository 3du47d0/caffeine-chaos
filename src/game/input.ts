/**
 * Unified Input Abstraction Layer
 * Supports: Keyboard/Mouse, Touch (virtual joystick), Gamepad
 */

export interface InputState {
  moveX: number;    // -1 to 1
  moveY: number;    // -1 to 1
  aimX: number;     // canvas-space
  aimY: number;     // canvas-space
  shoot: boolean;
  dash: boolean;
  ultimate: boolean;
  interact: boolean;
}

export interface TouchJoystickState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  id: number;
}

export class InputManager {
  // Keyboard state
  keys = new Set<string>();
  
  // Mouse state
  mousePos = { x: 400, y: 300 };
  mouseDown = false;
  
  // Touch joystick
  joystick: TouchJoystickState = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0, id: -1 };
  touchButtons = { shoot: false, dash: false, ultimate: false };
  
  // Gamepad
  gamepadIndex: number | null = null;
  gamepadAimAngle = 0;
  
  // Device detection
  isTouchDevice = false;
  
  private canvas: HTMLCanvasElement | null = null;
  private canvasWidth = 800;
  private canvasHeight = 600;
  
  constructor() {
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  attach(canvas: HTMLCanvasElement, canvasWidth: number, canvasHeight: number) {
    this.canvas = canvas;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Keyboard
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    
    // Mouse
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
    
    // Touch (on document to capture joystick outside canvas)
    document.addEventListener('touchstart', this.onTouchStart, { passive: false });
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd, { passive: false });
    
    // Gamepad
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }
  
  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.onMouseMove);
      this.canvas.removeEventListener('mousedown', this.onMouseDown);
      this.canvas.removeEventListener('mouseup', this.onMouseUp);
    }
    
    document.removeEventListener('touchstart', this.onTouchStart);
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
    
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }
  
  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase());
  };
  
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
  
  private onMouseMove = (e: MouseEvent) => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvasWidth / rect.width;
    const scaleY = this.canvasHeight / rect.height;
    this.mousePos = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };
  
  private onMouseDown = () => { this.mouseDown = true; };
  private onMouseUp = () => { this.mouseDown = false; };
  
  // Touch handling - joystick is left half, buttons are right half
  private onTouchStart = (e: TouchEvent) => {
    const screenW = window.innerWidth;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      
      // Left half = joystick
      if (touch.clientX < screenW * 0.4 && !this.joystick.active) {
        this.joystick = {
          active: true,
          startX: touch.clientX,
          startY: touch.clientY,
          currentX: touch.clientX,
          currentY: touch.clientY,
          id: touch.identifier,
        };
        this.isTouchDevice = true;
        e.preventDefault();
      }
    }
  };
  
  private onTouchMove = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystick.id) {
        this.joystick.currentX = touch.clientX;
        this.joystick.currentY = touch.clientY;
        e.preventDefault();
      }
    }
  };
  
  private onTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystick.id) {
        this.joystick.active = false;
        this.joystick.id = -1;
      }
    }
  };
  
  setTouchButton(button: 'shoot' | 'dash' | 'ultimate', pressed: boolean) {
    this.touchButtons[button] = pressed;
    this.isTouchDevice = true;
  }
  
  private onGamepadConnected = (e: GamepadEvent) => {
    this.gamepadIndex = e.gamepad.index;
    console.log('Gamepad connected:', e.gamepad.id);
  };
  
  private onGamepadDisconnected = () => {
    this.gamepadIndex = null;
  };
  
  private readGamepad(): { moveX: number; moveY: number; aimX: number; aimY: number; shoot: boolean; dash: boolean; ult: boolean } | null {
    if (this.gamepadIndex === null) return null;
    const gp = navigator.getGamepads()[this.gamepadIndex];
    if (!gp) return null;
    
    const deadzone = 0.15;
    const applyDeadzone = (v: number) => Math.abs(v) < deadzone ? 0 : v;
    
    const moveX = applyDeadzone(gp.axes[0] || 0);
    const moveY = applyDeadzone(gp.axes[1] || 0);
    const aimRawX = applyDeadzone(gp.axes[2] || 0);
    const aimRawY = applyDeadzone(gp.axes[3] || 0);
    
    // Track aim angle from right stick
    if (Math.abs(aimRawX) > deadzone || Math.abs(aimRawY) > deadzone) {
      this.gamepadAimAngle = Math.atan2(aimRawY, aimRawX);
    }
    
    const aimX = this.canvasWidth / 2 + Math.cos(this.gamepadAimAngle) * 200;
    const aimY = this.canvasHeight / 2 + Math.sin(this.gamepadAimAngle) * 200;
    
    // Auto-shoot when aiming with right stick
    const shoot = (Math.abs(aimRawX) > deadzone || Math.abs(aimRawY) > deadzone) || gp.buttons[7]?.pressed || false;
    const dash = gp.buttons[0]?.pressed || gp.buttons[4]?.pressed || false;  // A / LB
    const ult = gp.buttons[1]?.pressed || gp.buttons[5]?.pressed || false;   // B / RB
    
    return { moveX, moveY, aimX, aimY, shoot, dash, ult };
  }
  
  /** Call once per frame to get combined input */
  getInput(playerPos: { x: number; y: number }): InputState {
    let moveX = 0, moveY = 0;
    let aimX = this.mousePos.x, aimY = this.mousePos.y;
    let shoot = this.mouseDown;
    let dash = false;
    let ultimate = false;
    let interact = false;
    
    // Keyboard
    if (this.keys.has('w') || this.keys.has('arrowup')) moveY -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) moveY += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) moveX -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) moveX += 1;
    if (this.keys.has(' ')) dash = true;
    if (this.keys.has('q')) ultimate = true;
    if (this.keys.has('e') || this.keys.has('enter')) interact = true;
    
    // Touch joystick
    if (this.joystick.active) {
      const dx = this.joystick.currentX - this.joystick.startX;
      const dy = this.joystick.currentY - this.joystick.startY;
      const maxDist = 50;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        moveX = Math.max(-1, Math.min(1, dx / maxDist));
        moveY = Math.max(-1, Math.min(1, dy / maxDist));
      }
      // Auto-aim: aim in movement direction on touch
      if (dist > 10) {
        const norm = Math.sqrt(moveX * moveX + moveY * moveY);
        if (norm > 0) {
          aimX = playerPos.x + (moveX / norm) * 200;
          aimY = playerPos.y + (moveY / norm) * 200;
        }
      }
    }
    
    // Touch buttons
    if (this.touchButtons.shoot) shoot = true;
    if (this.touchButtons.dash) dash = true;
    if (this.touchButtons.ultimate) ultimate = true;
    
    // Gamepad (overrides if connected and active)
    const gp = this.readGamepad();
    if (gp) {
      if (Math.abs(gp.moveX) > 0 || Math.abs(gp.moveY) > 0) {
        moveX = gp.moveX;
        moveY = gp.moveY;
      }
      aimX = gp.aimX;
      aimY = gp.aimY;
      if (gp.shoot) shoot = true;
      if (gp.dash) dash = true;
      if (gp.ult) ultimate = true;
    }
    
    return { moveX, moveY, aimX, aimY, shoot, dash, ultimate, interact };
  }
  
  /** For gamepad menu navigation: returns d-pad / stick direction and confirm/back */
  getMenuInput(): { up: boolean; down: boolean; left: boolean; right: boolean; confirm: boolean; back: boolean } {
    const result = { up: false, down: false, left: false, right: false, confirm: false, back: false };
    
    // Keyboard
    if (this.keys.has('arrowup') || this.keys.has('w')) result.up = true;
    if (this.keys.has('arrowdown') || this.keys.has('s')) result.down = true;
    if (this.keys.has('arrowleft') || this.keys.has('a')) result.left = true;
    if (this.keys.has('arrowright') || this.keys.has('d')) result.right = true;
    if (this.keys.has('enter') || this.keys.has(' ')) result.confirm = true;
    if (this.keys.has('escape')) result.back = true;
    
    // Gamepad
    if (this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        const deadzone = 0.5;
        if ((gp.axes[1] || 0) < -deadzone || gp.buttons[12]?.pressed) result.up = true;
        if ((gp.axes[1] || 0) > deadzone || gp.buttons[13]?.pressed) result.down = true;
        if ((gp.axes[0] || 0) < -deadzone || gp.buttons[14]?.pressed) result.left = true;
        if ((gp.axes[0] || 0) > deadzone || gp.buttons[15]?.pressed) result.right = true;
        if (gp.buttons[0]?.pressed) result.confirm = true;  // A
        if (gp.buttons[1]?.pressed) result.back = true;     // B
      }
    }
    
    return result;
  }
  
  hasGamepad(): boolean {
    return this.gamepadIndex !== null;
  }
}

/** Detect device performance tier */
export function getPerformanceTier(): 'low' | 'medium' | 'high' {
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4;
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  
  if (isMobile && (cores <= 4 || memory <= 2)) return 'low';
  if (isMobile || cores <= 4) return 'medium';
  return 'high';
}

export function getParticleMultiplier(tier: 'low' | 'medium' | 'high'): number {
  switch (tier) {
    case 'low': return 0.3;
    case 'medium': return 0.6;
    case 'high': return 1.0;
  }
}
