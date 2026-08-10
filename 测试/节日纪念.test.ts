import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { 创建北京时间, 获取传统节日 } from "../src/历法";
import type { 农历日期 } from "../src/历法/农历";
import { 解析配置 } from "../src/规则/配置读取";
import { 获取神圣纪念日 } from "../src/规则/神圣纪念日";

const 配置 = 解析配置(
  "神圣纪念日.txt",
  readFileSync(resolve(process.cwd(), "配置/神圣纪念日.txt"), "utf8"),
);

function 农历(月: number, 日: number, 月名: string, 日名: string, 是否闰月 = false): 农历日期 {
  return { 年: 2026, 月, 日, 月名, 日名, 是否闰月, 显示: `${月名}${日名}` };
}

describe("lunar-typescript 传统节日", () => {
  it.each([
    [2024, 2, 10, "春节"],
    [2024, 2, 24, "元宵节"],
    [2024, 6, 10, "端午节"],
    [2024, 9, 17, "中秋节"],
  ])("%i-%i-%i 包含%s", (年, 月, 日, 节日) => {
    expect(获取传统节日(创建北京时间(年, 月, 日))).toContain(节日);
  });
});

describe("神圣纪念日自然语言匹配", () => {
  it("单日规则匹配正月初九", () => {
    expect(获取神圣纪念日(配置, 农历(1, 9, "正月", "初九"))).toContain("玉皇上帝圣诞");
  });

  it("正月十五保留同日与范围事件且不混入已迁出的斗降", () => {
    const 事件 = 获取神圣纪念日(配置, 农历(1, 15, "正月", "十五"));
    expect(事件).toEqual(
      expect.arrayContaining(["上元天官圣诞", "门神户尉圣诞", "佑圣真君圣诞", "显大神通降魔"]),
    );
    expect(事件).not.toContain("北斗下降之辰");
    expect(事件.length).toBeGreaterThanOrEqual(7);
  });

  it("九月初一至初九每天匹配范围规则", () => {
    for (let 日 = 1; 日 <= 9; 日 += 1) {
      const 日名 = 日 === 1 ? "初一" : `初${"一二三四五六七八九"[日 - 1]}`;
      expect(获取神圣纪念日(配置, 农历(9, 日, "九月", 日名))).toContain("北斗九皇降世之辰");
    }
  });

  it("范围外日期不命中九皇降世规则", () => {
    expect(获取神圣纪念日(配置, 农历(9, 10, "九月", "初十"))).not.toContain("北斗九皇降世之辰");
  });

  it("原玉匣记北斗下降项目不再参与神圣纪念", () => {
    expect(获取神圣纪念日(配置, 农历(2, 8, "二月", "初八"))).not.toContain("北斗下降之辰");
    expect(获取神圣纪念日(配置, 农历(11, 8, "十一月", "初八"))).not.toContain("北斗下降之辰");
  });

  it("闰月不重复普通神圣纪念或每月规则", () => {
    expect(获取神圣纪念日(配置, 农历(6, 15, "闰六月", "十五", true))).toEqual([]);
    expect(获取神圣纪念日(配置, 农历(6, 8, "闰六月", "初八", true))).toEqual([]);
  });
});
