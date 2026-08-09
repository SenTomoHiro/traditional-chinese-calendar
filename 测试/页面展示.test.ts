import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const 页面源码 = readFileSync(resolve(process.cwd(), "src/main.ts"), "utf8");
const 页面样式 = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

describe("日期详情展示回归", () => {
  it("以农历、四柱和值星组成核心信息层级", () => {
    expect(页面源码).toContain('class="lunar-title"');
    expect(页面源码).toContain("${历法结果.农历.显示}");
    expect(页面源码).toContain('class="pillar-core"');
    expect(页面源码).toContain("${四柱}");
    expect(页面源码).toContain('class="value-star-core"');
    expect(页面源码).toContain("${历法结果.值星}日");
  });

  it("保留小号公历日期且不再渲染巨型公历日号", () => {
    expect(页面源码).toContain('class="solar-date"');
    expect(页面源码).toContain("${格式化公历日期(所选)}");
    expect(页面源码).not.toContain("selected-day-number");
    expect(页面样式).not.toContain(".selected-day-number");
  });

  it("四柱不再拆分且详情不重复显示月建或时辰字段", () => {
    expect(页面源码).not.toContain("<dt>年柱</dt>");
    expect(页面源码).not.toContain("<dt>月柱</dt>");
    expect(页面源码).not.toContain("<dt>日柱</dt>");
    expect(页面源码).not.toContain("<dt>时辰</dt>");
    expect(页面源码).not.toContain("<dt>时柱</dt>");
    expect(页面源码).not.toContain("<dt>月建</dt>");
  });

  it("将三项既有时辰规则归入风水禁忌速查", () => {
    expect(页面源码).toContain('<h3>风水禁忌速查</h3>');
    expect(页面源码).toContain("判断全部时辰规则");
    expect(页面源码).not.toContain("现有时辰规则");
  });

  it("移动端源码顺序为核心详情、月历、辅助计算", () => {
    const 详情位置 = 页面源码.indexOf('<aside class="detail-card"');
    const 月历位置 = 页面源码.indexOf('<article class="calendar-card"');
    const 计算位置 = 页面源码.indexOf('<section class="calculation-card"');

    expect(详情位置).toBeGreaterThan(-1);
    expect(详情位置).toBeLessThan(月历位置);
    expect(月历位置).toBeLessThan(计算位置);
    expect(页面样式).toContain('"detail calendar"');
    expect(页面样式).toContain('"calculation calendar"');
    expect(页面样式).toMatch(/"detail"\s+"calendar"\s+"calculation"/u);
  });

  it("月历与详情都已接入节日和神圣纪念", () => {
    expect(页面源码).toContain("创建月历日期信息");
    expect(页面源码).toContain('事件列表("传统节日"');
    expect(页面源码).toContain('事件列表("神圣纪念"');
  });
});
