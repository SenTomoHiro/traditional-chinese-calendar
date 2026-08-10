import { 移动日期 } from "../日历/公历";

export function 格式化主日期值(日期: Date): string {
  return `${日期.getFullYear()}-${String(日期.getMonth() + 1).padStart(2, "0")}-${String(日期.getDate()).padStart(2, "0")}`;
}

/** 只接受浏览器 date 输入框的完整合法值，未完成或越界时返回 null。 */
export function 解析主日期值(值: string, 最小日期: string, 最大日期: string): Date | null {
  const 匹配 = 值.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (!匹配 || 值 < 最小日期 || 值 > 最大日期) return null;
  const [年, 月, 日] = [匹配[1], 匹配[2], 匹配[3]].map(Number);
  const 日期 = new Date(年, 月 - 1, 日);
  return 日期.getFullYear() === 年 && 日期.getMonth() === 月 - 1 && 日期.getDate() === 日 ? 日期 : null;
}

export function 移动主日期(日期: Date, 偏移天数: -1 | 1, 最小日期: string, 最大日期: string): Date | null {
  const 候选日期 = 移动日期(日期, 偏移天数);
  return 解析主日期值(格式化主日期值(候选日期), 最小日期, 最大日期);
}
