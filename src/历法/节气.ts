import {
  从公历读取时间,
  是同一公历日,
  比较北京时间,
  转为公历,
  type 北京时间,
} from "./时间";

export const 二十四节气名称 = [
  "小寒",
  "大寒",
  "立春",
  "雨水",
  "惊蛰",
  "春分",
  "清明",
  "谷雨",
  "立夏",
  "小满",
  "芒种",
  "夏至",
  "小暑",
  "大暑",
  "立秋",
  "处暑",
  "白露",
  "秋分",
  "寒露",
  "霜降",
  "立冬",
  "小雪",
  "大雪",
  "冬至",
] as const;

export type 节气名称 = (typeof 二十四节气名称)[number];

export interface 节气时刻 extends 北京时间 {
  名称: 节气名称;
}

export type 月建 = "寅" | "卯" | "辰" | "巳" | "午" | "未" | "申" | "酉" | "戌" | "亥" | "子" | "丑";

export interface 节气月结果 {
  月建: 月建;
  边界节气: 节气名称;
  交节时刻: 节气时刻;
}

const 英文节气名: Record<string, 节气名称> = {
  XIAO_HAN: "小寒",
  DA_HAN: "大寒",
  LI_CHUN: "立春",
  YU_SHUI: "雨水",
  JING_ZHE: "惊蛰",
  CHUN_FEN: "春分",
  QING_MING: "清明",
  GU_YU: "谷雨",
  LI_XIA: "立夏",
  XIAO_MAN: "小满",
  MANG_ZHONG: "芒种",
  XIA_ZHI: "夏至",
  XIAO_SHU: "小暑",
  DA_SHU: "大暑",
  LI_QIU: "立秋",
  CHU_SHU: "处暑",
  BAI_LU: "白露",
  QIU_FEN: "秋分",
  HAN_LU: "寒露",
  SHUANG_JIANG: "霜降",
  LI_DONG: "立冬",
  XIAO_XUE: "小雪",
  DA_XUE: "大雪",
  DONG_ZHI: "冬至",
};

const 节气月边界: Readonly<Record<节气名称, 月建 | undefined>> = {
  小寒: "丑",
  大寒: undefined,
  立春: "寅",
  雨水: undefined,
  惊蛰: "卯",
  春分: undefined,
  清明: "辰",
  谷雨: undefined,
  立夏: "巳",
  小满: undefined,
  芒种: "午",
  夏至: undefined,
  小暑: "未",
  大暑: undefined,
  立秋: "申",
  处暑: undefined,
  白露: "酉",
  秋分: undefined,
  寒露: "戌",
  霜降: undefined,
  立冬: "亥",
  小雪: undefined,
  大雪: "子",
  冬至: undefined,
};

const 年度节气缓存 = new Map<number, 节气时刻[]>();

function 标准化节气名(名称: string): 节气名称 | null {
  if ((二十四节气名称 as readonly string[]).includes(名称)) return 名称 as 节气名称;
  return 英文节气名[名称] ?? null;
}

export function 获取年度节气(年: number): 节气时刻[] {
  const 已缓存 = 年度节气缓存.get(年);
  if (已缓存) return 已缓存.map((节气) => ({ ...节气 }));

  const 节气表 = 转为公历({ 年, 月: 6, 日: 15, 时: 12, 分: 0, 秒: 0 }).getLunar().getJieQiTable();
  const 结果 = Object.entries(节气表)
    .map(([原名, 公历]) => {
      const 名称 = 标准化节气名(原名);
      if (!名称 || 公历.getYear() !== 年) return null;
      return { 名称, ...从公历读取时间(公历) } satisfies 节气时刻;
    })
    .filter((节气): 节气 is 节气时刻 => 节气 !== null)
    .filter((节气, 索引, 全部) => 全部.findIndex((候选) => 候选.名称 === 节气.名称) === 索引)
    .sort((左, 右) => 比较北京时间(左, 右));

  年度节气缓存.set(年, 结果);
  return 结果.map((节气) => ({ ...节气 }));
}

export function 获取指定节气(年: number, 名称: 节气名称): 节气时刻 {
  const 结果 = 获取年度节气(年).find((节气) => 节气.名称 === 名称);
  if (!结果) throw new Error(`无法取得 ${年} 年${名称}交节时刻`);
  return 结果;
}

export function 获取当日节气(时间: 北京时间): 节气时刻 | null {
  return 获取年度节气(时间.年).find((节气) => 是同一公历日(节气, 时间)) ?? null;
}

export function 获取节气月(时间: 北京时间): 节气月结果 {
  const 边界 = [时间.年 - 1, 时间.年]
    .flatMap(获取年度节气)
    .filter((节气) => 节气月边界[节气.名称] !== undefined)
    .filter((节气) => 比较北京时间(节气, 时间) <= 0)
    .sort((左, 右) => 比较北京时间(右, 左))[0];

  if (!边界) throw new Error("无法确定当前节气月");
  return {
    月建: 节气月边界[边界.名称] as 月建,
    边界节气: 边界.名称,
    交节时刻: 边界,
  };
}
