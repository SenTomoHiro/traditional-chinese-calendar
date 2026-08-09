import { 地支 } from "../历法/干支";
import type { 时支 } from "../历法/真太阳时";
import type { 配置错误, 配置解析结果, 配置规则 } from "./配置读取";

export const 值神名称 = ["青龙", "明堂", "天刑", "朱雀", "金匮", "天德", "白虎", "玉堂", "天牢", "玄武", "司命", "勾陈"] as const;

export type 时辰值神 = (typeof 值神名称)[number];
export type 时辰吉凶 = "吉" | "凶";

export interface 时辰吉凶配置 {
  青龙起时: Record<时支, 时支>;
  值神顺序: 时辰值神[];
  吉神: 时辰值神[];
  凶神: 时辰值神[];
}

export interface 时辰吉凶解析结果 {
  配置: 时辰吉凶配置 | null;
  错误: 配置错误[];
}

export interface 时辰值神结果 {
  值神: 时辰值神 | "配置错误";
  吉凶: 时辰吉凶 | "—";
}

function 列表(内容: string): string[] {
  return 内容.split(/[、,，]/u).map((项) => 项.trim()).filter(Boolean);
}

function 配置错误项(规则: 配置规则 | null, 信息: string): 配置错误 {
  return {
    文件名: "时辰吉凶.txt",
    行号: 规则?.行号 ?? 0,
    原文: 规则?.原文 ?? "",
    信息,
  };
}

function 解析值神列表(规则: 配置规则 | undefined, 名称: string, 错误: 配置错误[]): 时辰值神[] {
  if (!规则) {
    错误.push(配置错误项(null, `缺少“${名称}”配置`));
    return [];
  }
  const 结果 = 列表(规则.内容);
  const 无效 = 结果.filter((值神) => !值神名称.includes(值神 as 时辰值神));
  if (无效.length > 0 || new Set(结果).size !== 结果.length) {
    错误.push(配置错误项(规则, `“${名称}”包含无效或重复值神`));
    return [];
  }
  return 结果 as 时辰值神[];
}

export function 解析时辰吉凶配置(配置结果: 配置解析结果 | undefined): 时辰吉凶解析结果 {
  if (!配置结果) {
    return { 配置: null, 错误: [配置错误项(null, "缺少配置文件")] };
  }

  const 错误 = [...配置结果.错误];
  const 青龙起时: Partial<Record<时支, 时支>> = {};
  const 专用条件 = new Set(["值神", "吉", "凶"]);

  for (const 规则 of 配置结果.规则.filter((候选) => !专用条件.has(候选.条件))) {
    const 起时 = 规则.内容.replace(/时$/u, "") as 时支;
    const 日支列表 = 列表(规则.条件).map((条件) => 条件.replace(/日$/u, "") as 时支);
    if (!地支.includes(起时) || 日支列表.length === 0 || 日支列表.some((日支) => !地支.includes(日支))) {
      错误.push(配置错误项(规则, "青龙起时必须使用有效的日支与时支"));
      continue;
    }
    for (const 日支 of 日支列表) {
      if (青龙起时[日支]) {
        错误.push(配置错误项(规则, `“${日支}日”重复配置`));
      } else {
        青龙起时[日支] = 起时;
      }
    }
  }

  const 缺少日支 = 地支.filter((日支) => !青龙起时[日支]);
  if (缺少日支.length > 0) 错误.push(配置错误项(null, `缺少${缺少日支.join("、")}日的青龙起时`));

  const 值神顺序 = 解析值神列表(配置结果.规则.find((规则) => 规则.条件 === "值神"), "值神", 错误);
  const 吉神 = 解析值神列表(配置结果.规则.find((规则) => 规则.条件 === "吉"), "吉", 错误);
  const 凶神 = 解析值神列表(配置结果.规则.find((规则) => 规则.条件 === "凶"), "凶", 错误);

  if (值神顺序.length !== 12 || new Set(值神顺序).size !== 12) {
    const 规则 = 配置结果.规则.find((候选) => 候选.条件 === "值神") ?? null;
    错误.push(配置错误项(规则, "值神顺序必须完整包含十二值神"));
  }
  const 吉凶全集 = [...吉神, ...凶神];
  if (吉神.length !== 6 || 凶神.length !== 6 || new Set(吉凶全集).size !== 12 || 值神名称.some((值神) => !吉凶全集.includes(值神))) {
    错误.push(配置错误项(null, "吉凶分组必须各含六神并完整覆盖十二值神"));
  }

  if (错误.length > 0) return { 配置: null, 错误 };
  return {
    配置: {
      青龙起时: 青龙起时 as Record<时支, 时支>,
      值神顺序,
      吉神,
      凶神,
    },
    错误: [],
  };
}

export function 计算时辰值神(配置: 时辰吉凶配置 | null, 日支: 时支, 当前时支: 时支): 时辰值神结果 {
  if (!配置) return { 值神: "配置错误", 吉凶: "—" };
  const 起时索引 = 地支.indexOf(配置.青龙起时[日支]);
  const 当前索引 = 地支.indexOf(当前时支);
  const 值神 = 配置.值神顺序[(当前索引 - 起时索引 + 12) % 12];
  return { 值神, 吉凶: 配置.吉神.includes(值神) ? "吉" : "凶" };
}
