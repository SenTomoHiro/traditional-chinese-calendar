export interface 可查看时辰 {
  键: string;
  当前: boolean;
}

/** 未手动固定时始终跟随当前时辰；手动查看则保持对应键。 */
export function 选出查看时辰<T extends 可查看时辰>(
  全部时段: T[],
  手动查看键: string | null,
): T | undefined {
  return (手动查看键 ? 全部时段.find((时段) => 时段.键 === 手动查看键) : undefined)
    ?? 全部时段.find((时段) => 时段.当前)
    ?? 全部时段[0];
}

/** 点击当前时辰即恢复自动跟随；其他时辰则保持手动查看。 */
export function 更新手动查看键(时辰键: string, 是当前时辰: boolean): string | null {
  return 是当前时辰 ? null : 时辰键;
}
