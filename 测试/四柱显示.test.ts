import { describe, expect, it } from "vitest";
import { 格式化四柱 } from "../src/历法";

describe("四柱页面展示", () => {
  it("合并为年月日时一行，不重复输出时支字段", () => {
    expect(格式化四柱({ 年柱: "丙午", 月柱: "丙申", 日柱: "乙卯", 时柱: "丁亥" })).toBe(
      "丙午年　丙申月　乙卯日　丁亥时",
    );
  });
});
