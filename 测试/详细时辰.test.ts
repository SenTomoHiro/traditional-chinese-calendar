import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { 天干, 地支 } from "../src/历法/干支";
import { 计算时柱, type 时支 } from "../src/历法/真太阳时";
import { 计算详细时辰, 解析详细时辰配置 } from "../src/规则/详细时辰";
import { 计算时辰值神, 解析时辰吉凶配置 } from "../src/规则/时辰吉凶";
import { 解析配置, type 配置解析结果 } from "../src/规则/配置读取";

function 读配置(文件名: string): 配置解析结果 {
  return 解析配置(文件名, readFileSync(resolve(process.cwd(), "配置", 文件名), "utf8"));
}

const 配置结果 = [读配置("时辰神煞.txt"), 读配置("时辰宜忌.txt")];
const 详细解析 = 解析详细时辰配置(配置结果);
const 详细配置 = 详细解析.配置;
const 吉凶配置 = 解析时辰吉凶配置(读配置("时辰吉凶.txt")).配置;
const 六十甲子 = Array.from({ length: 60 }, (_, 索引) => `${天干[索引 % 10]}${地支[索引 % 12]}`);

function 详情(日柱: string, 时支: 时支) {
  const 时柱 = 计算时柱(日柱, 时支);
  const 值神 = 计算时辰值神(吉凶配置, 日柱[1] as 时支, 时支);
  return 计算详细时辰(详细配置, 日柱, 时柱, 值神.值神, 值神.吉凶);
}

describe("详细时辰中文配置校验", () => {
  it("两份配置完整解析且覆盖通书六十事", () => {
    expect(详细解析.错误).toEqual([]);
    expect(详细配置).not.toBeNull();
    expect(详细配置?.用事).toHaveLength(60);
    expect(详细配置?.用事.every((事项) => Array.isArray(事项.宜) && Array.isArray(事项.忌))).toBe(true);
  });

  it("拒绝未知神煞且不会抛出异常", () => {
    const 错误宜忌 = 解析配置("时辰宜忌.txt", "祭祀宜：天徳错字\n祭祀忌：无");
    const 结果 = 解析详细时辰配置([读配置("时辰神煞.txt"), 错误宜忌]);
    expect(结果.配置).toBeNull();
    expect(结果.错误.some((错误) => 错误.信息.includes("未知条件"))).toBe(true);
  });

  it("五不遇定局必须完整覆盖十日干", () => {
    const 原配置 = readFileSync(resolve(process.cwd(), "配置", "时辰神煞.txt"), "utf8");
    const 缺项配置 = 解析配置("时辰神煞.txt", 原配置.replace("、癸日己未时", ""));
    const 结果 = 解析详细时辰配置([缺项配置, 读配置("时辰宜忌.txt")]);
    expect(结果.配置).toBeNull();
    expect(结果.错误.some((错误) => 错误.信息.includes("五不遇缺少癸日定局"))).toBe(true);
  });

  it("来源核对文档覆盖每一项配置", () => {
    const 文档 = readFileSync(resolve(process.cwd(), "资料", "时辰宜忌来源核对.md"), "utf8");
    for (const 事项 of 详细配置?.用事 ?? []) {
      expect(文档, `来源文档应记录${事项.名称}`).toContain(`| ${事项.名称} |`);
    }
    expect(文档).toContain("第三轮（异本交叉）");
  });
});

describe("六十甲子日乘十二时支完整性质", () => {
  it("完整计算720种组合且每种结果结构有效", () => {
    let 组合数 = 0;
    for (const 日柱 of 六十甲子) {
      for (const 时支 of 地支) {
        const 结果 = 详情(日柱, 时支);
        expect(结果.依据).toContain("协纪辨方书");
        expect(new Set(结果.日时关系).size).toBe(结果.日时关系.length);
        expect(new Set(结果.吉神).size).toBe(结果.吉神.length);
        expect(new Set(结果.凶煞).size).toBe(结果.凶煞.length);
        expect(结果.时宜.every((事项) => !结果.时忌.includes(事项))).toBe(true);
        组合数 += 1;
      }
    }
    expect(组合数).toBe(720);
  });

  it("每一日都有唯一建、破、合、害与完整旬空", () => {
    for (const 日柱 of 六十甲子) {
      const 十二结果 = 地支.map((时支) => 详情(日柱, 时支));
      for (const 关系 of ["日建", "日破", "日合", "日害"] as const) {
        expect(十二结果.filter((结果) => 结果.日时关系.includes(关系)), `${日柱}${关系}`).toHaveLength(1);
      }
      expect(十二结果.filter((结果) => 结果.凶煞.includes("旬空")), `${日柱}旬空`).toHaveLength(2);
      expect(十二结果.filter((结果) => 结果.吉神.includes("日禄")), `${日柱}日禄`).toHaveLength(1);
      expect(十二结果.filter((结果) => 结果.吉神.includes("日马")), `${日柱}日马`).toHaveLength(1);
      expect(十二结果.filter((结果) => 结果.吉神.includes("天乙贵人")), `${日柱}天乙贵人`).toHaveLength(2);
      expect(十二结果.filter((结果) => 结果.吉神.includes("喜神")), `${日柱}喜神`).toHaveLength(1);
      expect(十二结果.some((结果) => 结果.吉神.includes("天官贵人")), `${日柱}天官贵人`).toBe(true);
      expect(十二结果.some((结果) => 结果.吉神.includes("福星贵人")), `${日柱}福星贵人`).toBe(true);
      expect(十二结果.filter((结果) => 结果.凶煞.includes("五不遇")), `${日柱}五不遇`).toHaveLength(1);
      const 路空数量 = 十二结果.filter((结果) => 结果.凶煞.includes("路空")).length;
      expect(路空数量, `${日柱}路空`).toBe(["戊", "癸"].includes(日柱[0]) ? 4 : 2);

      const 值神 = 地支.map((时支) => 计算时辰值神(吉凶配置, 日柱[1] as 时支, 时支).值神);
      expect(new Set(值神).size, `${日柱}十二值神`).toBe(12);
    }
  });

  it("甲子日关键定局与卷三十二一致", () => {
    expect(详情("甲子", "子").日时关系).toContain("日建");
    expect(详情("甲子", "丑")).toMatchObject({ 日时关系: ["日合"], 吉神: expect.arrayContaining(["天乙贵人"]) });
    expect(详情("甲子", "寅").吉神).toEqual(expect.arrayContaining(["福星贵人", "喜神", "日禄", "日马"]));
    expect(详情("甲子", "卯").日时关系).toContain("日刑");
    expect(详情("甲子", "午")).toMatchObject({ 日时关系: ["日破"], 凶煞: expect.arrayContaining(["五不遇"]) });
    expect(详情("甲子", "未")).toMatchObject({ 日时关系: ["日害"], 吉神: expect.arrayContaining(["天乙贵人"]) });
    expect(详情("甲子", "未").凶煞).not.toContain("五不遇");
    expect(详情("甲子", "申").凶煞).toContain("路空");
    expect(详情("甲子", "酉")).toMatchObject({ 吉神: expect.arrayContaining(["天官贵人"]), 凶煞: ["路空"] });
    expect(详情("甲子", "戌").凶煞).toContain("旬空");
    expect(详情("甲子", "亥").凶煞).toContain("旬空");
  });

  it("黄历宜忌与古籍神煞分层输出", () => {
    const 结果 = 详情("甲子", "寅");
    expect(结果.吉神).toEqual(expect.arrayContaining(["福星贵人", "喜神", "日禄", "日马"]));
    expect(结果.时宜.length).toBeGreaterThan(0);
    expect(结果.依据).toContain("lunar-typescript 1.8.6");
  });

  it("五不遇和日破不擅自覆盖独立黄历数据", () => {
    const 结果 = 详情("甲子", "午");
    expect(结果.日时关系).toContain("日破");
    expect(结果.凶煞).toContain("五不遇");
    expect(Array.isArray(结果.时宜)).toBe(true);
    expect(Array.isArray(结果.时忌)).toBe(true);
  });

  it("宜忌同时命中但没有制化依据时不输出确定结论", () => {
    expect(详细配置).not.toBeNull();
    const 冲突配置 = {
      ...详细配置!,
      用事: [{ 名称: "测试事项", 宜: ["旬空"], 忌: ["旬空"] }],
    };
    const 时柱 = 计算时柱("甲子", "戌");
    const 值神 = 计算时辰值神(吉凶配置, "子", "戌");
    const 结果 = 计算详细时辰(冲突配置, "甲子", 时柱, 值神.值神, 值神.吉凶);
    expect(结果.冲突).toEqual(["测试事项"]);
    expect(结果.未判定用事).toContain("测试事项");
    expect(结果.时宜).not.toContain("测试事项");
    expect(结果.时忌).not.toContain("测试事项");
  });
});
