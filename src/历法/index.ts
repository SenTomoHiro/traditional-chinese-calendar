import { 计算干支 } from "./干支";
import { 转换为农历, type 农历日期 } from "./农历";
import { 获取当日节气, type 节气时刻, type 月建 } from "./节气";
import { 创建北京时间, type 北京时间 } from "./时间";
import { 计算值星, type 值星 } from "./值星";

export interface 历法结果 {
  农历: 农历日期;
  节气: 节气时刻 | null;
  年柱: string;
  月柱: string;
  日柱: string;
  月建: 月建;
  值星: 值星;
  时柱: string | null;
  计算时刻: 北京时间;
}

/** 日期详情统一以当天北京时间 12:00 为日期级计算基准。 */
export function 计算日期详情(年: number, 月: number, 日: number): 历法结果 {
  return 计算历法(创建北京时间(年, 月, 日));
}

/** 接受具体北京时间，供交节边界测试和下一阶段时柱直接复用。 */
export function 计算历法(计算时刻: 北京时间): 历法结果 {
  const 农历 = 转换为农历(计算时刻);
  const 节气 = 获取当日节气(计算时刻);
  const 干支 = 计算干支(计算时刻);
  return {
    农历,
    节气,
    年柱: 干支.年柱,
    月柱: 干支.月柱,
    日柱: 干支.日柱,
    月建: 干支.月建,
    值星: 计算值星(干支.月建, 干支.日支),
    时柱: null,
    计算时刻,
  };
}

export { 创建北京时间 } from "./时间";
export { 二十四节气名称, 获取年度节气, 获取当日节气, 获取指定节气, 获取节气月 } from "./节气";
export { 计算年柱, 计算月柱, 计算日柱 } from "./干支";
export { 转换为农历 } from "./农历";
export { 计算值星 } from "./值星";
