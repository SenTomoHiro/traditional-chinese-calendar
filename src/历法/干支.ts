import { 获取指定节气, 获取节气月, type 月建 } from "./节气";
import { 比较北京时间, 平移时间, 转为公历, type 北京时间 } from "./时间";

export const 天干 = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const 地支 = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export interface 干支结果 {
  年柱: string;
  月柱: string;
  日柱: string;
  日支: (typeof 地支)[number];
  月建: 月建;
}

function 正模(值: number, 模: number): number {
  return ((值 % 模) + 模) % 模;
}

export function 计算年柱(时间: 北京时间): string {
  const 立春 = 获取指定节气(时间.年, "立春");
  const 干支年 = 比较北京时间(时间, 立春) >= 0 ? 时间.年 : 时间.年 - 1;
  return `${天干[正模(干支年 - 4, 10)]}${地支[正模(干支年 - 4, 12)]}`;
}

export function 计算月柱(时间: 北京时间, 年柱 = 计算年柱(时间)): { 月柱: string; 月建: 月建 } {
  const { 月建 } = 获取节气月(时间);
  const 年干索引 = 天干.indexOf(年柱[0] as (typeof 天干)[number]);
  const 月支索引 = 地支.indexOf(月建);
  const 寅月干索引 = (年干索引 % 5) * 2 + 2;
  const 从寅月起的偏移 = 正模(月支索引 - 地支.indexOf("寅"), 12);
  const 月干 = 天干[正模(寅月干索引 + 从寅月起的偏移, 10)];
  return { 月柱: `${月干}${月建}`, 月建 };
}

/** 子时从 23:00 开始；日柱计算在此刻统一进入下一传统历法日。 */
export function 获取日柱计算时间(时间: 北京时间): 北京时间 {
  return 时间.时 >= 23 ? 平移时间(时间, 60 * 60) : 时间;
}

/** 项目唯一的日柱入口，其他模块不得自行重复处理换日边界。 */
export function 计算日柱(时间: 北京时间): { 日柱: string; 日支: (typeof 地支)[number] } {
  const 农历 = 转为公历(获取日柱计算时间(时间)).getLunar();
  return {
    日柱: 农历.getDayInGanZhiExact2(),
    日支: 农历.getDayZhiExact2() as (typeof 地支)[number],
  };
}

export function 计算干支(时间: 北京时间): 干支结果 {
  const 年柱 = 计算年柱(时间);
  const { 月柱, 月建 } = 计算月柱(时间, 年柱);
  const { 日柱, 日支 } = 计算日柱(时间);
  return { 年柱, 月柱, 日柱, 日支, 月建 };
}
