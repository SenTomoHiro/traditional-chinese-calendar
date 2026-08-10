import { 转为公历, type 北京时间 } from "./时间";

export type 日天神 = "青龙" | "明堂" | "天刑" | "朱雀" | "金匮" | "天德" | "白虎" | "玉堂" | "天牢" | "玄武" | "司命" | "勾陈";
export type 黄黑道 = "黄道" | "黑道";
export type 日吉凶 = "吉" | "凶";

export interface 日吉凶结果 {
  天神: 日天神;
  类型: 黄黑道;
  吉凶: 日吉凶;
}

/** 直接复用 lunar-typescript 的十二天神值日、黄黑道与吉凶接口。 */
export function 计算日吉凶(时间: 北京时间): 日吉凶结果 {
  const 农历 = 转为公历(时间).getLunar();
  return {
    天神: 农历.getDayTianShen() as 日天神,
    类型: 农历.getDayTianShenType() as 黄黑道,
    吉凶: 农历.getDayTianShenLuck() as 日吉凶,
  };
}
