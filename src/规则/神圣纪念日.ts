import type { 农历日期 } from "../历法/农历";
import type { 配置解析结果 } from "./配置读取";

const 农历月份 = [
  "正月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
] as const;

function 解析农历日(名称: string): number | null {
  const 数字: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (名称 === "初十" || 名称 === "十") return 10;
  if (名称 === "二十") return 20;
  if (名称 === "三十") return 30;
  if (名称.startsWith("初")) return 数字[名称.slice(1)] ?? null;
  if (名称.startsWith("十")) return 10 + (数字[名称.slice(1)] ?? 0);
  if (名称.startsWith("廿")) return 20 + (数字[名称.slice(1)] ?? 0);
  return null;
}

function 规范配置月名(月名: string): string {
  if (月名 === "冬月") return "十一月";
  if (月名 === "腊月") return "十二月";
  return 月名;
}

function 匹配范围(条件: string, 农历: 农历日期): boolean {
  const [起始文本, 结束原文, 多余部分] = 条件.split("至");
  if (!起始文本 || !结束原文 || 多余部分 !== undefined) return false;
  const 月名 = 农历月份.find((候选) => 起始文本.startsWith(候选));
  if (!月名 || 月名 !== 规范配置月名(农历.月名)) return false;

  const 起始日 = 解析农历日(起始文本.slice(月名.length));
  const 结束文本 = 结束原文.startsWith(月名) ? 结束原文.slice(月名.length) : 结束原文;
  const 结束日 = 解析农历日(结束文本);
  return 起始日 !== null && 结束日 !== null && 农历.日 >= 起始日 && 农历.日 <= 结束日;
}

function 匹配条件(条件: string, 农历: 农历日期): boolean {
  if (条件 === `${规范配置月名(农历.月名)}${农历.日名}`) return true;
  if (条件 === `每月${农历.日名}`) return true;
  return 条件.includes("至") && 匹配范围(条件, 农历);
}

/** 闰月默认不重复任何普通或“每月”神圣纪念。 */
export function 获取神圣纪念日(
  配置: 配置解析结果 | undefined,
  农历: 农历日期,
): string[] {
  if (!配置 || 农历.是否闰月) return [];
  return 配置.规则.filter((规则) => 匹配条件(规则.条件, 农历)).map((规则) => 规则.内容);
}
