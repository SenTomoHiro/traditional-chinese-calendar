import { 地支, 天干, 获取日柱计算时间, 计算日柱 } from "./干支";
import { 平移时间, type 北京时间 } from "./时间";

export type 时支 = (typeof 地支)[number];

export interface 真太阳时结果 {
  北京时间: 北京时间;
  真太阳时: 北京时间;
  经度修正分钟: number;
  均时差分钟: number;
  总修正分钟: number;
}

export interface 最终时间结果 {
  北京时间: 北京时间;
  真太阳时: 北京时间 | null;
  最终时间: 北京时间;
  日柱计算时间: 北京时间;
  计算依据: "真太阳时" | "北京时间（未取得定位）";
  经度修正分钟: number | null;
  均时差分钟: number | null;
  总修正分钟: number | null;
  时支: 时支;
  时柱: string;
  日柱: string;
  日支: 时支;
}

function 是闰年(年: number): boolean {
  return 年 % 4 === 0 && (年 % 100 !== 0 || 年 % 400 === 0);
}

function 一年中的日序(时间: 北京时间): number {
  const 年初 = Date.UTC(时间.年, 0, 1);
  const 当日 = Date.UTC(时间.年, 时间.月 - 1, 时间.日);
  return Math.floor((当日 - 年初) / 86_400_000) + 1;
}

/** NOAA fractional-year 近似公式，返回当日指定时刻的均时差（分钟）。 */
export function 计算均时差分钟(时间: 北京时间): number {
  const 年天数 = 是闰年(时间.年) ? 366 : 365;
  const 小时 = 时间.时 + 时间.分 / 60 + 时间.秒 / 3600;
  const 年分数 = (2 * Math.PI * (一年中的日序(时间) - 1 + (小时 - 12) / 24)) / 年天数;
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(年分数) -
      0.032077 * Math.sin(年分数) -
      0.014615 * Math.cos(2 * 年分数) -
      0.040849 * Math.sin(2 * 年分数))
  );
}

/** 中国标准时 UTC+8 对应东经 120°中央经线，每经度相差 4 分钟。 */
export function 计算经度修正分钟(经度: number): number {
  if (!Number.isFinite(经度) || 经度 < -180 || 经度 > 180) {
    throw new RangeError("经度必须是 -180 到 180 之间的有效数字");
  }
  return (经度 - 120) * 4;
}

export function 计算真太阳时(北京时间: 北京时间, 经度: number): 真太阳时结果 {
  const 经度修正分钟 = 计算经度修正分钟(经度);
  const 均时差分钟 = 计算均时差分钟(北京时间);
  const 总修正分钟 = 经度修正分钟 + 均时差分钟;
  return {
    北京时间,
    真太阳时: 平移时间(北京时间, 总修正分钟 * 60),
    经度修正分钟,
    均时差分钟,
    总修正分钟,
  };
}

export function 计算时支(时间: 北京时间): 时支 {
  const 当日秒数 = 时间.时 * 3600 + 时间.分 * 60 + 时间.秒;
  const 索引 = Math.floor(((当日秒数 + 3600) % 86_400) / 7200);
  return 地支[索引];
}

/** 五鼠遁：甲己日起甲子，乙庚丙子，丙辛戊子，丁壬庚子，戊癸壬子。 */
export function 计算时柱(日柱或日干: string, 当前时支: 时支): string {
  const 日干索引 = 天干.indexOf(日柱或日干[0] as (typeof 天干)[number]);
  const 时支索引 = 地支.indexOf(当前时支);
  if (日干索引 < 0 || 时支索引 < 0) throw new Error("无法根据无效干支计算时柱");
  const 子时天干索引 = (日干索引 % 5) * 2;
  return `${天干[(子时天干索引 + 时支索引) % 10]}${当前时支}`;
}

/** 所有日期、日柱、时柱和时辰规则均应只读取本结果中的“最终时间”。 */
export function 计算最终时间(北京时间: 北京时间, 经度: number | null): 最终时间结果 {
  const 真太阳时计算 = 经度 === null ? null : 计算真太阳时(北京时间, 经度);
  const 最终时间 = 真太阳时计算?.真太阳时 ?? 北京时间;
  const 日柱计算时间 = 获取日柱计算时间(最终时间);
  const { 日柱, 日支 } = 计算日柱(最终时间);
  const 时支 = 计算时支(最终时间);
  return {
    北京时间,
    真太阳时: 真太阳时计算?.真太阳时 ?? null,
    最终时间,
    日柱计算时间,
    计算依据: 真太阳时计算 ? "真太阳时" : "北京时间（未取得定位）",
    经度修正分钟: 真太阳时计算?.经度修正分钟 ?? null,
    均时差分钟: 真太阳时计算?.均时差分钟 ?? null,
    总修正分钟: 真太阳时计算?.总修正分钟 ?? null,
    时支,
    时柱: 计算时柱(日柱, 时支),
    日柱,
    日支,
  };
}
