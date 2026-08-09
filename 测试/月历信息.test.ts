import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { 创建月历日期信息, 格式化农历摘要 } from "../src/日历/月历信息";
import { 解析配置 } from "../src/规则/配置读取";

const 神圣纪念配置 = 解析配置(
  "神圣纪念日.txt",
  readFileSync(resolve(process.cwd(), "配置/神圣纪念日.txt"), "utf8"),
);

describe("月历农历与事件摘要", () => {
  it("完整公历月份的每一天都有农历信息", () => {
    const 八月 = 创建月历日期信息(2026, 7, 神圣纪念配置);
    expect(八月).toHaveLength(31);
    expect(八月.every((日期) => 日期.农历摘要.length > 0 && 日期.农历.显示.length > 0)).toBe(true);
  });

  it("农历初一显示月份而不是初一", () => {
    const 初一 = 创建月历日期信息(2026, 7, 神圣纪念配置).find((日期) => 日期.农历.日 === 1);
    expect(初一?.农历摘要).toBe(初一?.农历.月名);
    expect(初一?.农历摘要).not.toBe("初一");
  });

  it("普通日期显示初九、十五、廿四等日名", () => {
    const 八月 = 创建月历日期信息(2026, 7, 神圣纪念配置);
    for (const 日名 of ["初九", "十五", "廿四"]) {
      expect(八月.find((日期) => 日期.农历.日名 === 日名)?.农历摘要).toBe(日名);
    }
  });

  it("闰月初一明确显示闰月名称", () => {
    const 七月 = 创建月历日期信息(2025, 6, 神圣纪念配置);
    const 闰月初一 = 七月.find((日期) => 日期.农历.是否闰月 && 日期.农历.日 === 1);
    expect(闰月初一?.农历摘要).toBe("闰六月");
  });

  it("多事件日期只保留一个月历摘要并记录其余数量", () => {
    const 春节 = 创建月历日期信息(2024, 1, 神圣纪念配置).find((日期) => 日期.公历日 === 10);
    expect(春节?.事件摘要).toBe("春节");
    expect(春节?.其余事件数).toBeGreaterThan(0);
  });

  it("格式化函数对普通日期只返回日名", () => {
    expect(
      格式化农历摘要({ 年: 2026, 月: 6, 日: 27, 是否闰月: false, 月名: "六月", 日名: "廿七", 显示: "六月廿七" }),
    ).toBe("廿七");
  });
});
