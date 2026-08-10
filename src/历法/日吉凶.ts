import 日吉凶配置文本 from "../../配置/日吉凶.txt?raw";
import { 解析配置 } from "../规则/配置读取";
import { 地支, 计算月柱, 计算日柱 } from "./干支";
import type { 月建 } from "./节气";
import type { 北京时间 } from "./时间";

export type 日天神 = "青龙" | "明堂" | "天刑" | "朱雀" | "金匮" | "天德" | "白虎" | "玉堂" | "天牢" | "玄武" | "司命" | "勾陈";
export type 黄黑道 = "黄道" | "黑道";
export type 日吉凶 = "吉" | "凶";

export interface 日吉凶结果 {
  天神: 日天神;
  类型: 黄黑道;
  吉凶: 日吉凶;
}

interface 日吉凶配置 {
  青龙起日: Record<月建, (typeof 地支)[number]>;
  值神: 日天神[];
  吉神: Set<日天神>;
}

function 正模(值: number, 模: number): number {
  return ((值 % 模) + 模) % 模;
}

export function 解析日吉凶配置(文本 = 日吉凶配置文本): 日吉凶配置 {
  const 结果 = 解析配置("日吉凶.txt", 文本);
  if (结果.错误.length > 0) throw new Error(结果.错误.map((错误) => 错误.信息).join("；"));
  const 青龙起日 = {} as Record<月建, (typeof 地支)[number]>;
  const 值神规则 = 结果.规则.find((规则) => 规则.条件 === "值神");
  const 吉规则 = 结果.规则.find((规则) => 规则.条件 === "吉");
  const 凶规则 = 结果.规则.find((规则) => 规则.条件 === "凶");
  const 列表 = (内容: string) => 内容.split("、").map((名称) => 名称.trim()).filter(Boolean);

  for (const 规则 of 结果.规则) {
    const 匹配 = 规则.条件.match(/^([子丑寅卯辰巳午未申酉戌亥]+)月$/u);
    if (!匹配) continue;
    const 起日 = 规则.内容.match(/^([子丑寅卯辰巳午未申酉戌亥])日$/u)?.[1] as (typeof 地支)[number] | undefined;
    if (!起日) throw new Error(`日吉凶配置无法识别“${规则.原文}”`);
    for (const 月支 of [...匹配[1]] as 月建[]) 青龙起日[月支] = 起日;
  }

  const 值神 = 列表(值神规则?.内容 ?? "") as 日天神[];
  const 吉神 = new Set(列表(吉规则?.内容 ?? "") as 日天神[]);
  const 凶神 = new Set(列表(凶规则?.内容 ?? "") as 日天神[]);
  if (Object.keys(青龙起日).length !== 12 || 值神.length !== 12 || 吉神.size !== 6 || 凶神.size !== 6) {
    throw new Error("日吉凶配置不完整");
  }
  if (值神.some((神) => !吉神.has(神) && !凶神.has(神))) throw new Error("日吉凶值神缺少吉凶分类");
  return { 青龙起日, 值神, 吉神 };
}

const 默认配置 = 解析日吉凶配置();

/** 按《协纪辨方书》卷七“天罡加月建”自主推算十二天神。 */
export function 计算日吉凶(时间: 北京时间, 配置 = 默认配置): 日吉凶结果 {
  const 月建 = 计算月柱(时间).月建;
  const 日支 = 计算日柱(时间).日支;
  const 起日 = 配置.青龙起日[月建];
  const 天神 = 配置.值神[正模(地支.indexOf(日支) - 地支.indexOf(起日), 12)];
  const 吉 = 配置.吉神.has(天神);
  return { 天神, 类型: 吉 ? "黄道" : "黑道", 吉凶: 吉 ? "吉" : "凶" };
}
