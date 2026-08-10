import 现代时辰宜忌文本 from "../../配置/现代时辰宜忌.txt?raw";
import { 天干, 地支 } from "../历法/干支";
import type { 时支 } from "../历法/真太阳时";

export const 现代时辰宜忌来源 = "现代黄历宜忌体系" as const;

export interface 现代时辰宜忌结果 {
  时宜: string[];
  时忌: string[];
  来源: typeof 现代时辰宜忌来源;
}

export interface 现代时辰宜忌配置 {
  查询(日柱: string, 时支: 时支): 现代时辰宜忌结果;
  组合数: number;
}

function 解析列表(文本: string): string[] {
  return 文本 === "无" ? [] : 文本.split("、").map((条目) => 条目.trim()).filter(Boolean);
}

export function 解析现代时辰宜忌(文本 = 现代时辰宜忌文本): 现代时辰宜忌配置 {
  const 数据 = new Map<string, Omit<现代时辰宜忌结果, "来源">>();

  文本.split(/\r?\n/u).forEach((原文, 索引) => {
    const 行 = 原文.trim();
    if (!行 || 行.startsWith("#")) return;
    const 匹配 = 行.match(/^([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])日 ([子丑寅卯辰巳午未申酉戌亥])时：宜：(.+?)；忌：(.+)$/u);
    if (!匹配) throw new Error(`现代时辰宜忌第${索引 + 1}行无法识别：${原文}`);
    const 键 = `${匹配[1]}-${匹配[2]}`;
    if (数据.has(键)) throw new Error(`现代时辰宜忌重复配置：${键}`);
    数据.set(键, { 时宜: 解析列表(匹配[3]), 时忌: 解析列表(匹配[4]) });
  });

  const 六十甲子 = Array.from({ length: 60 }, (_, 索引) => `${天干[索引 % 10]}${地支[索引 % 12]}`);
  const 缺少 = 六十甲子.flatMap((日柱) => 地支.map((时支) => `${日柱}-${时支}`)).filter((键) => !数据.has(键));
  if (数据.size !== 720 || 缺少.length > 0) {
    throw new Error(`现代时辰宜忌配置不完整：已有${数据.size}组，缺少${缺少.slice(0, 5).join("、") || "未知组合"}`);
  }

  return {
    组合数: 数据.size,
    查询(日柱, 时支) {
      const 结果 = 数据.get(`${日柱}-${时支}`);
      if (!结果) throw new Error(`现代时辰宜忌不存在：${日柱}日${时支}时`);
      return { 时宜: [...结果.时宜], 时忌: [...结果.时忌], 来源: 现代时辰宜忌来源 };
    },
  };
}

export const 默认现代时辰宜忌配置 = 解析现代时辰宜忌();
