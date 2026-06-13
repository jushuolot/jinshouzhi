/** 演示用撮合匹配度（距离 + 评分 + 服务次数） */
export function parseDistanceKm(raw: string | number | undefined): number | undefined {
  if (raw == null || raw === '') return undefined;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  const m = String(raw).match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : undefined;
}

export function computeMatchScore(opts: {
  distanceKm?: number;
  rating?: number;
  orderCount?: number;
}): number {
  let score = 72;
  const d = opts.distanceKm;
  if (d != null) {
    if (d <= 1) score += 20;
    else if (d <= 2) score += 16;
    else if (d <= 3) score += 12;
    else if (d <= 5) score += 8;
    else score += 4;
  }
  if (opts.rating != null && opts.rating > 0) {
    score += Math.min(6, Math.round((opts.rating - 4) * 8));
  }
  if (opts.orderCount != null && opts.orderCount >= 15) score += 3;
  return Math.min(98, Math.max(70, score));
}

export function matchScoreLabel(score: number): string {
  if (score >= 92) return '极佳匹配';
  if (score >= 85) return '推荐匹配';
  return '可预约';
}
