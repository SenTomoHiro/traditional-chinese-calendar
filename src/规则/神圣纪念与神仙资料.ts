import type { 农历日期 } from "../历法/农历";

export interface 神圣纪念日期 {
  原文: string;
  月: number;
  起始日: number;
  结束日: number;
}

export interface 神圣纪念事件 {
  日期: 神圣纪念日期;
  名称: string;
  类型: string;
}

export interface 神仙人物资料 {
  主名称: string;
  匹配名称: string[];
  纪念事件: 神圣纪念事件[];
  神像: string;
  宝诰标题: string;
  宝诰出处: string;
  宝诰版本说明: string;
  宝诰: string;
  简介: string;
}

export interface 神仙资料错误 {
  文件名: string;
  行号: number;
  信息: string;
}

export interface 神圣纪念资料解析结果 {
  文件名: string;
  人物: 神仙人物资料[];
  独立纪念事件: 神圣纪念事件[];
  错误: 神仙资料错误[];
}

export interface 当日神圣纪念 {
  名称: string;
  类型: string;
  人物: 神仙人物资料 | null;
}

export interface 神仙人物匹配 {
  开始: number;
  结束: number;
  匹配文本: string;
  人物: 神仙人物资料;
}

const 单行字段 = ["匹配名称", "神像", "宝诰标题", "宝诰出处", "宝诰版本说明"] as const;
const 月份 = new Map([
  ["正月", 1], ["一月", 1], ["二月", 2], ["三月", 3], ["四月", 4], ["五月", 5], ["六月", 6],
  ["七月", 7], ["八月", 8], ["九月", 9], ["十月", 10], ["十一月", 11], ["冬月", 11],
  ["十二月", 12], ["腊月", 12],
]);
const 日期 = new Map([
  "初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十",
  "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十",
  "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十",
].map((名称, 索引) => [名称, 索引 + 1] as const));

function 行号(文本: string, 位置: number): number {
  return 文本.slice(0, 位置).split(/\r?\n/u).length;
}

function 读取单行(块: string, 字段: typeof 单行字段[number]): string | null {
  return 块.match(new RegExp(`^${字段}：(.*)$`, "mu"))?.[1].trim() ?? null;
}

function 读取事件字段(块: string, 字段: "日期" | "名称" | "类型"): string | null {
  return 块.match(new RegExp(`^${字段}：(.+)$`, "mu"))?.[1].trim() ?? null;
}

function 读取多行(块: string, 开始标记: string, 结束标记: string): string | null {
  const 匹配 = 块.match(new RegExp(`^【${开始标记}】[ \\t]*\\r?\\n([\\s\\S]*?)^【${结束标记}】[ \\t]*$`, "mu"));
  if (!匹配) return null;
  return 匹配[1]
    .replace(/^(?:[ \t]*\r?\n)+/u, "")
    .replace(/(?:\r?\n[ \t]*)+$/u, "");
}

function 拆分名称(文本: string): string[] {
  return 文本.split("；").map((名称) => 名称.trim()).filter(Boolean);
}

export function 解析神圣纪念日期(原文: string): 神圣纪念日期 | null {
  const 日期名称 = [...日期.keys()].join("|");
  const 月份名称 = [...月份.keys()].sort((甲, 乙) => 乙.length - 甲.length).join("|");
  const 匹配 = 原文.match(new RegExp(`^农历(${月份名称})(${日期名称})(?:至(?:(${月份名称}))?(${日期名称}))?$`, "u"));
  if (!匹配) return null;
  const 月 = 月份.get(匹配[1]);
  const 起始日 = 日期.get(匹配[2]);
  const 结束月 = 匹配[3] ? 月份.get(匹配[3]) : 月;
  const 结束日 = 匹配[4] ? 日期.get(匹配[4]) : 起始日;
  if (!月 || !起始日 || !结束月 || !结束日 || 月 !== 结束月 || 起始日 > 结束日) return null;
  return { 原文, 月, 起始日, 结束日 };
}

function 解析纪念事件(
  文件名: string,
  全文: string,
  块: string,
  块位置: number,
  错误: 神仙资料错误[],
): 神圣纪念事件 | null {
  const 日期文本 = 读取事件字段(块, "日期");
  const 名称 = 读取事件字段(块, "名称");
  const 类型 = 读取事件字段(块, "类型");
  const 当前行号 = 行号(全文, 块位置);
  if (!日期文本 || !名称 || !类型) {
    错误.push({ 文件名, 行号: 当前行号, 信息: "纪念事件必须完整填写日期、名称和类型" });
    return null;
  }
  const 解析日期 = 解析神圣纪念日期(日期文本);
  if (!解析日期) {
    错误.push({ 文件名, 行号: 当前行号, 信息: `纪念事件日期格式无法解析：${日期文本}` });
    return null;
  }
  return { 日期: 解析日期, 名称, 类型 };
}

function 解析人物纪念事件(
  文件名: string,
  全文: string,
  块: string,
  块位置: number,
  错误: 神仙资料错误[],
): 神圣纪念事件[] {
  const 结果: 神圣纪念事件[] = [];
  const 模式 = /^【纪念事件】[ \t]*\r?\n([\s\S]*?)^【纪念结束】[ \t]*$/gmu;
  let 匹配: RegExpExecArray | null;
  while ((匹配 = 模式.exec(块)) !== null) {
    const 事件 = 解析纪念事件(文件名, 全文, 匹配[1], 块位置 + 匹配.index, 错误);
    if (事件) 结果.push(事件);
  }
  return 结果;
}

export function 人物有前台内容(人物: 神仙人物资料): boolean {
  return Boolean(人物.神像 || 人物.宝诰 || 人物.简介);
}

export function 解析神圣纪念与神仙资料(文件名: string, 文本: string): 神圣纪念资料解析结果 {
  const 结果: 神圣纪念资料解析结果 = { 文件名, 人物: [], 独立纪念事件: [], 错误: [] };
  const 块模式 = /^【人物：([^】\r\n]+)】[ \t]*\r?\n([\s\S]*?)^【人物结束】[ \t]*$/gmu;
  const 主名称索引 = new Map<string, number>();
  const 匹配名称索引 = new Map<string, { 主名称: string; 行号: number }>();
  let 匹配: RegExpExecArray | null;

  while ((匹配 = 块模式.exec(文本)) !== null) {
    const 主名称 = 匹配[1].trim();
    const 块 = 匹配[2];
    const 起始行 = 行号(文本, 匹配.index);
    const 已有主名称行 = 主名称索引.get(主名称);
    if (已有主名称行 !== undefined) {
      结果.错误.push({ 文件名, 行号: 起始行, 信息: `人物主名称“${主名称}”重复，首次出现在第 ${已有主名称行} 行` });
      continue;
    }
    主名称索引.set(主名称, 起始行);

    const 字段值 = Object.fromEntries(单行字段.map((字段) => [字段, 读取单行(块, 字段)])) as Record<typeof 单行字段[number], string | null>;
    for (const 字段 of 单行字段) {
      if (字段值[字段] === null) 结果.错误.push({ 文件名, 行号: 起始行, 信息: `人物“${主名称}”缺少“${字段}”字段` });
    }
    const 宝诰 = 读取多行(块, "宝诰开始", "宝诰结束");
    const 简介 = 读取多行(块, "简介开始", "简介结束");
    if (宝诰 === null) 结果.错误.push({ 文件名, 行号: 起始行, 信息: `人物“${主名称}”缺少完整宝诰区块` });
    if (简介 === null) 结果.错误.push({ 文件名, 行号: 起始行, 信息: `人物“${主名称}”缺少完整简介区块` });

    const 人物: 神仙人物资料 = {
      主名称,
      匹配名称: 拆分名称(字段值.匹配名称 ?? ""),
      纪念事件: 解析人物纪念事件(文件名, 文本, 块, 匹配.index, 结果.错误),
      神像: 字段值.神像 ?? "",
      宝诰标题: 字段值.宝诰标题 ?? "",
      宝诰出处: 字段值.宝诰出处 ?? "",
      宝诰版本说明: 字段值.宝诰版本说明 ?? "",
      宝诰: 宝诰 ?? "",
      简介: 简介 ?? "",
    };

    const 全部匹配名称 = [...new Set([人物.主名称, ...人物.匹配名称])];
    for (const 名称 of 全部匹配名称) {
      const 已有 = 匹配名称索引.get(名称);
      if (已有 && 已有.主名称 !== 主名称) {
        结果.错误.push({
          文件名,
          行号: 起始行,
          信息: `匹配名称“${名称}”同时属于“${已有.主名称}”与“${主名称}”（首次出现在第 ${已有.行号} 行）`,
        });
      } else 匹配名称索引.set(名称, { 主名称, 行号: 起始行 });
    }
    结果.人物.push(人物);
  }

  const 独立模式 = /^【独立纪念事件】[ \t]*\r?\n([\s\S]*?)^【独立纪念结束】[ \t]*$/gmu;
  while ((匹配 = 独立模式.exec(文本)) !== null) {
    const 事件 = 解析纪念事件(文件名, 文本, 匹配[1], 匹配.index, 结果.错误);
    if (事件) 结果.独立纪念事件.push(事件);
  }

  const 人物块数量 = 文本.match(/^【人物：/gmu)?.length ?? 0;
  const 人物结束数量 = 文本.match(/^【人物结束】[ \t]*$/gmu)?.length ?? 0;
  const 事件块数量 = 文本.match(/^【纪念事件】[ \t]*$/gmu)?.length ?? 0;
  const 事件结束数量 = 文本.match(/^【纪念结束】[ \t]*$/gmu)?.length ?? 0;
  const 独立块数量 = 文本.match(/^【独立纪念事件】[ \t]*$/gmu)?.length ?? 0;
  const 独立结束数量 = 文本.match(/^【独立纪念结束】[ \t]*$/gmu)?.length ?? 0;
  if (人物块数量 === 0) 结果.错误.push({ 文件名, 行号: 1, 信息: "未找到任何人物区块" });
  if (人物块数量 !== 结果.人物.length || 人物结束数量 !== 人物块数量) {
    结果.错误.push({ 文件名, 行号: 1, 信息: "存在未闭合或格式不正确的人物区块" });
  }
  const 已解析人物事件数 = 结果.人物.reduce((总数, 人物) => 总数 + 人物.纪念事件.length, 0);
  if (事件块数量 !== 事件结束数量 || 事件块数量 !== 已解析人物事件数) {
    结果.错误.push({ 文件名, 行号: 1, 信息: "存在未归属人物或格式不正确的纪念事件块" });
  }
  if (独立块数量 !== 独立结束数量 || 独立块数量 !== 结果.独立纪念事件.length) {
    结果.错误.push({ 文件名, 行号: 1, 信息: "存在格式不正确的独立纪念事件块" });
  }

  const 事件索引 = new Map<string, string>();
  const 全部事件 = [
    ...结果.人物.flatMap((人物) => 人物.纪念事件.map((事件) => ({ 事件, 归属: 人物.主名称 }))),
    ...结果.独立纪念事件.map((事件) => ({ 事件, 归属: "独立纪念" })),
  ];
  for (const { 事件, 归属 } of 全部事件) {
    const 键 = `${事件.日期.原文}\u0000${事件.名称}\u0000${事件.类型}`;
    const 已有归属 = 事件索引.get(键);
    if (已有归属) {
      结果.错误.push({ 文件名, 行号: 1, 信息: `纪念事件“${事件.名称}”重复出现在“${已有归属}”与“${归属}”` });
    } else 事件索引.set(键, 归属);
  }
  return 结果;
}

export function 获取神圣纪念日(配置: 神圣纪念资料解析结果 | undefined, 农历: 农历日期): 当日神圣纪念[] {
  if (!配置 || 农历.是否闰月) return [];
  const 日期命中 = (事件: 神圣纪念事件) => 事件.日期.月 === 农历.月
    && 农历.日 >= 事件.日期.起始日
    && 农历.日 <= 事件.日期.结束日;
  return [
    ...配置.人物.flatMap((人物) => 人物.纪念事件.filter(日期命中).map((事件) => ({ 名称: 事件.名称, 类型: 事件.类型, 人物 }))),
    ...配置.独立纪念事件.filter(日期命中).map((事件) => ({ 名称: 事件.名称, 类型: 事件.类型, 人物: null })),
  ];
}

export function 查找神仙人物(人物: readonly 神仙人物资料[], 主名称: string): 神仙人物资料 | undefined {
  return 人物.find((候选) => 候选.主名称 === 主名称);
}

export function 匹配神圣纪念人物(纪念文本: string, 人物列表: readonly 神仙人物资料[]): 神仙人物匹配[] {
  const 候选名称 = 人物列表
    .flatMap((人物) => [...new Set([人物.主名称, ...人物.匹配名称])].map((名称) => ({ 名称, 人物 })))
    .sort((左, 右) => 右.名称.length - 左.名称.length || 左.名称.localeCompare(右.名称, "zh-CN"));
  const 结果: 神仙人物匹配[] = [];
  for (let 位置 = 0; 位置 < 纪念文本.length;) {
    const 命中 = 候选名称.find((候选) => 纪念文本.startsWith(候选.名称, 位置));
    if (!命中) {
      位置 += 1;
      continue;
    }
    结果.push({ 开始: 位置, 结束: 位置 + 命中.名称.length, 匹配文本: 命中.名称, 人物: 命中.人物 });
    位置 += 命中.名称.length;
  }
  return 结果;
}
