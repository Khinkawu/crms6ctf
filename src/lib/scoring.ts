export function calculateDecayFactor(base_points: number): number {
  return (base_points * 0.5) / 100
}

export function calculateCurrentPoints(base_points: number, solve_count: number): number {
  const decay = calculateDecayFactor(base_points)
  return Math.max(Math.floor(base_points * 0.5), base_points - Math.floor(solve_count * decay))
}

export function getBloodBonus(solve_count: number): number {
  if (solve_count === 1) return 50
  if (solve_count === 2) return 25
  if (solve_count === 3) return 10
  return 0
}

export function calculatePointsAwarded(
  base_points: number,
  solve_count: number,
  hint_penalty_pct: number
): number {
  const current = calculateCurrentPoints(base_points, solve_count)
  const blood_bonus = getBloodBonus(solve_count)
  const penalty = Math.floor(current * (hint_penalty_pct / 100))
  return Math.max(1, current + blood_bonus - penalty)
}

export const DIFFICULTY_BASE_POINTS: Record<string, number> = {
  Easy: 100,
  Medium: 300,
  Hard: 500,
  Expert: 1000,
}

export const CATEGORY_COLORS: Record<string, string> = {
  GEN: 'text-green-400 border-green-400',
  CRYPTO: 'text-cyan-400 border-cyan-400',
  WEB: 'text-orange-400 border-orange-400',
  FOR: 'text-purple-400 border-purple-400',
  REV: 'text-red-400 border-red-400',
  MISC: 'text-yellow-400 border-yellow-400',
}

export const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'text-green-400',
  Medium: 'text-yellow-400',
  Hard: 'text-orange-400',
  Expert: 'text-red-400',
}
