import { describe, expect, it } from "vitest";
import { 初始化时辰配置 } from "../src/当前历时";
import {
  创建北京时间,
  计算历法,
  计算最终时间,
} from "../src/历法";
import { 计算详细时辰 } from "../src/规则/详细时辰";
import { 计算北斗, 解析北斗配置 } from "../src/规则/北斗";
import { 读取全部配置 } from "../src/规则/配置读取";

const 配置结果 = 读取全部配置();
const 时辰配置 = 初始化时辰配置(配置结果);
const 北斗配置 = 解析北斗配置(配置结果).配置;

function 伪随机日期(序号: number): { 年: number; 月: number; 日: number; 时: number } {
  let 种子 = (0x9e3779b9 ^ 序号) >>> 0;
  种子 = (Math.imul(种子, 1_664_525) + 1_013_904_223) >>> 0;
  const 年 = 1901 + (种子 % 199);
  种子 = (Math.imul(种子, 1_664_525) + 1_013_904_223) >>> 0;
  const 月 = 1 + (种子 % 12);
  const 月天数 = new Date(年, 月, 0).getDate();
  种子 = (Math.imul(种子, 1_664_525) + 1_013_904_223) >>> 0;
  const 日 = 1 + (种子 % 月天数);
  return { 年, 月, 日, 时: (序号 * 2 + 23) % 24 };
}

describe("自主黄历大范围验证", () => {
  it("连续十二个月均可生成日吉凶、日宜忌与抽样时辰", () => {
    for (let 月 = 1; 月 <= 12; 月 += 1) {
      for (const 日 of [1, 15, new Date(2026, 月, 0).getDate()]) {
        const 输入 = 创建北京时间(2026, 月, 日, (月 * 2 + 1) % 24, 30);
        const 最终 = 计算最终时间(输入, null);
        const 历法 = 计算历法(最终.最终时间);
        const 时辰 = 计算详细时辰(时辰配置.详细时辰, 最终.日柱, 最终.时柱, "配置错误", "—");
        expect(历法.日吉凶.天神).toBeTruthy();
        expect(历法.每日宜忌.宜.every((事项) => !历法.每日宜忌.忌.includes(事项))).toBe(true);
        expect(时辰.依据).toContain("项目中文配置");
      }
    }
  });

  it("随机1000个日期及其抽样时辰均完整、自洽且不依赖逐日数据", () => {
    for (let 序号 = 0; 序号 < 1_000; 序号 += 1) {
      const { 年, 月, 日, 时 } = 伪随机日期(序号);
      const 最终 = 计算最终时间(创建北京时间(年, 月, 日, 时, 30), null);
      const 历法 = 计算历法(最终.最终时间);
      const 时辰 = 计算详细时辰(时辰配置.详细时辰, 最终.日柱, 最终.时柱, "配置错误", "—");
      const 北斗 = 计算北斗(北斗配置, 历法.农历, 历法.日柱);
      expect(历法.日柱).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/u);
      expect(["黄道", "黑道"]).toContain(历法.日吉凶.类型);
      expect(历法.每日宜忌.宜.every((事项) => !历法.每日宜忌.忌.includes(事项))).toBe(true);
      expect(时辰.时宜.every((事项) => !时辰.时忌.includes(事项))).toBe(true);
      expect(北斗.本命下日).toBe(`${历法.日柱}年生人`);
      expect(北斗.本命星官).toContain("星君");
    }
  });

  it("公历年份边界仍按午夜更换权威日柱", () => {
    const 年末 = 计算最终时间(创建北京时间(2026, 12, 31, 23, 59), null);
    const 年初 = 计算最终时间(创建北京时间(2027, 1, 1, 0, 0), null);
    expect(年末.日柱).not.toBe(年初.日柱);
    expect(年末.时支).toBe("子");
    expect(年初.时支).toBe("子");
  });
});
