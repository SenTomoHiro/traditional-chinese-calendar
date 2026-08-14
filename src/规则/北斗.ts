import type { 农历日期 } from "../历法/农历";
import { 地支 } from "../历法/干支";
import type { 配置错误, 配置解析结果 } from "./配置读取";

export const 二十八章经来源 = "《太上北斗二十八章经》" as const;
export const 真经注来源 = "《太上玄灵北斗本命延生真经注》" as const;
export type 斗降来源 = typeof 二十八章经来源 | typeof 真经注来源;

export interface 斗降命中依据 {
  来源: 斗降来源;
  规则: string;
}

export interface 北斗配置 {
  二十八章经: Record<number, number[]>;
  真经注: Record<number, number[]>;
  真经注每月: number[];
  真经注干支日: string[];
  出生年支本命星官: Record<(typeof 地支)[number], string>;
}

export interface 北斗配置解析结果 {
  配置: 北斗配置 | null;
  错误: 配置错误[];
}

export interface 北斗结果 {
  斗降日: {
    命中: boolean;
    名称: "北斗下降" | "无";
    依据: 斗降命中依据[];
    来源显示: string;
  };
  本命下日: string;
  本命星官: string;
}

const 月名: Record<string, number> = {
  正月: 1, 二月: 2, 三月: 3, 四月: 4, 五月: 5, 六月: 6,
  七月: 7, 八月: 8, 九月: 9, 十月: 10, 十一月: 11, 十二月: 12,
};

function 解析农历日(文本: string): number | null {
  const 数字: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (文本 === "初十" || 文本 === "十") return 10;
  if (文本 === "二十") return 20;
  if (文本 === "三十") return 30;
  if (文本.startsWith("初")) return 数字[文本.slice(1)] ?? null;
  if (文本.startsWith("十")) return 10 + (数字[文本.slice(1)] ?? 0);
  if (文本.startsWith("廿")) return 20 + (数字[文本.slice(1)] ?? 0);
  return null;
}

function 错误项(文件名: string, 行号: number, 原文: string, 信息: string): 配置错误 {
  return { 文件名, 行号, 原文, 信息 };
}

function 解析月表(结果: 配置解析结果 | undefined, 文件名: string, 错误: 配置错误[]): Record<number, number[]> {
  const 月表: Record<number, number[]> = {};
  if (!结果) {
    错误.push(错误项(文件名, 0, "", "缺少配置文件"));
    return 月表;
  }
  错误.push(...结果.错误);
  for (const 规则 of 结果.规则) {
    const 月 = 月名[规则.条件];
    if (!月) continue;
    const 日期 = 规则.内容.split("、").map(解析农历日);
    if (日期.some((日) => 日 === null)) {
      错误.push(错误项(文件名, 规则.行号, 规则.原文, "包含无法识别的农历日期"));
      continue;
    }
    月表[月] = 日期 as number[];
  }
  if (Object.keys(月表).length !== 12) 错误.push(错误项(文件名, 0, "", "必须完整配置十二个月"));
  return 月表;
}

export function 解析北斗配置(配置结果: 配置解析结果[]): 北斗配置解析结果 {
  const 错误: 配置错误[] = [];
  const 二十八文件 = "斗降日-太上北斗二十八章经.txt";
  const 真经文件 = "斗降日-北斗本命延生真经注.txt";
  const 星官文件 = "本命星官.txt";
  const 二十八结果 = 配置结果.find((配置) => 配置.文件名 === 二十八文件);
  const 真经结果 = 配置结果.find((配置) => 配置.文件名 === 真经文件);
  const 星官结果 = 配置结果.find((配置) => 配置.文件名 === 星官文件);
  const 二十八章经 = 解析月表(二十八结果, 二十八文件, 错误);
  const 真经注 = 解析月表(真经结果, 真经文件, 错误);

  const 每月规则 = 真经结果?.规则.find((规则) => 规则.条件 === "每月");
  const 干支规则 = 真经结果?.规则.find((规则) => 规则.条件 === "干支日");
  const 闰月规则 = 真经结果?.规则.find((规则) => 规则.条件 === "闰月");
  const 真经注每月 = 每月规则?.内容.split("、").map(解析农历日) ?? [];
  const 真经注干支日 = 干支规则?.内容.split("、").filter(Boolean) ?? [];
  if (真经注每月.some((日) => 日 === null) || 真经注每月.length !== 2) {
    错误.push(错误项(真经文件, 每月规则?.行号 ?? 0, 每月规则?.原文 ?? "", "每月规则必须配置初三、廿七"));
  }
  if (真经注干支日.join("、") !== "甲子、庚申") {
    错误.push(错误项(真经文件, 干支规则?.行号 ?? 0, 干支规则?.原文 ?? "", "干支日必须配置甲子、庚申"));
  }
  if (闰月规则?.内容 !== "从前月") {
    错误.push(错误项(真经文件, 闰月规则?.行号 ?? 0, 闰月规则?.原文 ?? "", "必须明确配置“闰月从前月”"));
  }

  const 出生年支本命星官 = {} as Record<(typeof 地支)[number], string>;
  if (!星官结果) 错误.push(错误项(星官文件, 0, "", "缺少配置文件"));
  else {
    错误.push(...星官结果.错误);
    for (const 规则 of 星官结果.规则) {
      const 支列表 = [...规则.条件] as (typeof 地支)[number][];
      if (支列表.some((支) => !地支.includes(支))) {
        错误.push(错误项(星官文件, 规则.行号, 规则.原文, "包含无效地支"));
        continue;
      }
      for (const 出生年支 of 支列表) 出生年支本命星官[出生年支] = 规则.内容;
    }
  }
  if (Object.keys(出生年支本命星官).length !== 12) 错误.push(错误项(星官文件, 0, "", "必须完整覆盖十二出生年支"));
  if (错误.length > 0) return { 配置: null, 错误 };
  return {
    配置: {
      二十八章经,
      真经注,
      真经注每月: 真经注每月 as number[],
      真经注干支日,
      出生年支本命星官,
    },
    错误: [],
  };
}

function 日期规则名称(农历: 农历日期): string {
  return `${农历.月名}${农历.日名}`;
}

export function 计算北斗(配置: 北斗配置 | null, 农历: 农历日期, 当天日柱: string): 北斗结果 {
  const 本命下日对应生年干支 = 当天日柱;
  if (!配置) {
    return {
      斗降日: { 命中: false, 名称: "无", 依据: [], 来源显示: "" },
      本命下日: `${本命下日对应生年干支}年生人`,
      本命星官: "配置错误",
    };
  }
  const 依据: 斗降命中依据[] = [];
  if (!农历.是否闰月 && 配置.二十八章经[农历.月]?.includes(农历.日)) {
    依据.push({ 来源: 二十八章经来源, 规则: 日期规则名称(农历) });
  }
  if (配置.真经注[农历.月]?.includes(农历.日)) {
    依据.push({ 来源: 真经注来源, 规则: `${农历.是否闰月 ? "闰月从前月·" : ""}${日期规则名称(农历)}` });
  }
  if (配置.真经注每月.includes(农历.日)) {
    依据.push({ 来源: 真经注来源, 规则: `每月${农历.日名}` });
  }
  if (配置.真经注干支日.includes(当天日柱)) {
    依据.push({ 来源: 真经注来源, 规则: `${当天日柱}日` });
  }
  const 来源 = [...new Set(依据.map((条目) => 条目.来源))];
  const 来源显示 = 来源.join("、");
  const 出生年支 = 本命下日对应生年干支[1] as (typeof 地支)[number];
  return {
    斗降日: {
      命中: 依据.length > 0,
      名称: 依据.length > 0 ? "北斗下降" : "无",
      依据,
      来源显示,
    },
    本命下日: `${本命下日对应生年干支}年生人`,
    本命星官: 配置.出生年支本命星官[出生年支],
  };
}
