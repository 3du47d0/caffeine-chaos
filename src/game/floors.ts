/**
 * Floor Themes - unique visual identity and mechanics per floor
 */

export interface FloorTheme {
  id: string;
  name: string;
  floorColor: string;
  floorTileColor: string;
  wallColor: string;
  wallHighlight: string;
  ambientParticleColor: string;
  label: string;
  // Mechanical modifiers
  icyFloor?: boolean;       // Floor 2: slippery movement
  fireHazards?: boolean;    // Floor 3: random fire zones
}

export const FLOOR_THEMES: FloorTheme[] = [
  {
    id: 'cafeteria',
    name: 'A Cafeteria',
    floorColor: '#3D2B1F',
    floorTileColor: '#4A3728',
    wallColor: '#2C1810',
    wallHighlight: '#5C3D2E',
    ambientParticleColor: '#D4A03A',
    label: '☕ A Cafeteria',
  },
  {
    id: 'cold_storage',
    name: 'Armazém Frigorífico',
    floorColor: '#1A2A3A',
    floorTileColor: '#223848',
    wallColor: '#0F1A28',
    wallHighlight: '#3A5A7A',
    ambientParticleColor: '#87CEEB',
    label: '❄️ Armazém Frigorífico',
    icyFloor: true,
  },
  {
    id: 'roast_furnace',
    name: 'Fornalha de Torra',
    floorColor: '#3A1A0A',
    floorTileColor: '#4A2510',
    wallColor: '#2A0A00',
    wallHighlight: '#8B2500',
    ambientParticleColor: '#FF6B35',
    label: '🔥 Fornalha de Torra',
    fireHazards: true,
  },
  {
    id: 'secret_abyss',
    name: 'Abismo do Expresso',
    floorColor: '#0D0015',
    floorTileColor: '#1A0028',
    wallColor: '#150020',
    wallHighlight: '#6B0090',
    ambientParticleColor: '#FF00FF',
    label: '👑 Abismo do Expresso',
    fireHazards: true,
  },
];

export function getFloorTheme(floor: number): FloorTheme {
  return FLOOR_THEMES[Math.min(floor, FLOOR_THEMES.length - 1)];
}
