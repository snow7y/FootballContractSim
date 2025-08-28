// Central list of position enum values synchronized with prisma/schema.prisma
// Keep order logical (defensive -> midfield -> attacking)
export const POSITIONS = [
  'GK',
  'RB','RWB','CB','LB','LWB',
  'DM','CM','AM',
  'RW','LW','ST','CF',
] as const;

export type PositionCode = typeof POSITIONS[number];

// Helper to validate a value at runtime (e.g., from forms)
export function isPosition(value: string): value is PositionCode {
  return (POSITIONS as readonly string[]).includes(value);
}
