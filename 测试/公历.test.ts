import { describe, expect, it } from "vitest";
import {
  创建月历格,
  获取某月天数,
  获取某月首日星期,
  移动月份,
  选择日期,
  type 日历状态,
} from "../src/日历/公历";

describe("公历月历", () => {
  it("普通年份二月有 28 天", () => {
    expect(获取某月天数(2025, 1)).toBe(28);
  });

  it("闰年二月有 29 天", () => {
    expect(获取某月天数(2024, 1)).toBe(29);
  });

  it("正确计算每月第一天的星期位置", () => {
    expect(获取某月首日星期(2026, 7)).toBe(6);
    expect(创建月历格(2026, 7).slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
  });

  it("上一月可跨到上一年", () => {
    expect(移动月份(2026, 0, -1)).toEqual({ 年: 2025, 月: 11 });
  });

  it("下一月可跨到下一年", () => {
    expect(移动月份(2026, 11, 1)).toEqual({ 年: 2027, 月: 0 });
  });

  it("点击日期后同步所选日期和显示月份", () => {
    const 初始状态: 日历状态 = {
      年: 2026,
      月: 7,
      所选日期: new Date(2026, 7, 9),
    };
    const 新状态 = 选择日期(初始状态, new Date(2026, 7, 18));
    expect(新状态.所选日期.getDate()).toBe(18);
    expect(新状态.年).toBe(2026);
    expect(新状态.月).toBe(7);
  });
});
