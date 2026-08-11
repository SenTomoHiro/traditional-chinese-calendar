import { describe, expect, it } from "vitest";
import { 计算当前历时 } from "../src/当前历时";
import {
  创建北京时间,
  每日宜忌规则口径,
  获取指定节气,
  平移时间,
  解析日宜忌配置,
  计算干支,
  计算日期详情,
  计算日吉凶,
  计算每日宜忌,
} from "../src/历法";
import { 读取全部配置 } from "../src/规则/配置读取";
import { 创建每日宜忌展示 } from "../src/界面/每日宜忌展示";

const 时刻 = (年: number, 月: number, 日: number, 时 = 12, 分 = 0) => 创建北京时间(年, 月, 日, 时, 分);

describe("自主每日宜忌", () => {
  it("读取完整中文配置并对2026-08-09给出保守古籍结论", () => {
    expect(每日宜忌规则口径).toContain("项目中文配置");
    expect(解析日宜忌配置().用事).toHaveLength(60);
    const 结果 = 计算每日宜忌(时刻(2026, 8, 9));
    expect(结果.命中条件).toEqual(expect.arrayContaining(["危日", "乙日", "卯日"]));
    expect(结果.宜).toEqual(expect.arrayContaining(["安床", "伐木", "畋猎", "取鱼"]));
    expect(结果.忌).toContain("开渠穿井");
    expect(new Set(结果.宜.filter((事项) => 结果.忌.includes(事项))).size).toBe(0);
  });

  it("日期切换会同步刷新日柱、日吉凶与日宜忌", () => {
    const 当日 = 计算日期详情(2026, 8, 9);
    const 次日 = 计算日期详情(2026, 8, 10);
    expect(当日.日柱).not.toBe(次日.日柱);
    expect(当日.日吉凶).not.toEqual(次日.日吉凶);
    expect(当日.每日宜忌).not.toEqual(次日.每日宜忌);
  });

  it("23:30夜子仍用当日，00:30早子切换次日", () => {
    expect(计算每日宜忌(时刻(2026, 8, 9, 23, 30))).toEqual(计算每日宜忌(时刻(2026, 8, 9, 12)));
    expect(计算每日宜忌(时刻(2026, 8, 10, 0, 30))).not.toEqual(计算每日宜忌(时刻(2026, 8, 9, 23, 30)));
  });

  it("真太阳时跨日时与最终日期同步切换", () => {
    const 配置 = 读取全部配置();
    const 输入 = 时刻(2026, 8, 9, 1);
    const 北京 = 计算当前历时(输入, "北京时间", 60, 配置);
    const 真太阳 = 计算当前历时(输入, "真太阳时", 60, 配置);
    expect(北京.最终.最终时间.日).toBe(9);
    expect(真太阳.最终.最终时间.日).toBe(8);
    expect(北京.历法结果.每日宜忌).toEqual(计算每日宜忌(北京.最终.最终时间));
    expect(真太阳.历法结果.每日宜忌).toEqual(计算每日宜忌(真太阳.最终.最终时间));
  });

  it("每日宜忌与日吉凶独立，不以简单加减分互相覆盖", () => {
    expect(计算日吉凶(时刻(2026, 8, 9))).toEqual({ 天神: "朱雀", 类型: "黑道", 吉凶: "凶" });
    expect(计算每日宜忌(时刻(2026, 8, 9)).宜.length).toBeGreaterThan(0);
  });

  it("2026-08-13底层并非完整全忌，但展示层按日宜为空压缩为诸事不宜", () => {
    const 结果 = 计算每日宜忌(时刻(2026, 8, 13));
    expect(结果).toMatchObject({ 支持事项数: 60, 诸事不宜: false, 诸事皆宜: false });
    expect(结果.宜).toEqual([]);
    expect(结果.忌.length).toBeLessThan(结果.支持事项数);
    expect(结果.忌.length).toBeGreaterThan(0);
    expect(创建每日宜忌展示(结果)).toEqual({ 日宜: [], 日忌: ["诸事不宜"] });
    expect(计算每日宜忌(时刻(2026, 8, 13)).忌).toEqual(结果.忌);
  });

  it("展示层按空宜有忌或明确全宜压缩，且不改写底层数组", () => {
    const 全忌 = { 宜: [] as string[], 忌: ["事项甲", "事项乙"], 诸事不宜: true, 诸事皆宜: false };
    const 全宜 = { 宜: ["事项甲", "事项乙"], 忌: [] as string[], 诸事不宜: false, 诸事皆宜: true };
    const 部分忌 = { 宜: [] as string[], 忌: ["事项甲"], 诸事不宜: false, 诸事皆宜: false };
    const 有宜有忌 = { 宜: ["事项甲"], 忌: ["事项乙"], 诸事不宜: false, 诸事皆宜: false };
    const 双空 = { 宜: [] as string[], 忌: [] as string[], 诸事不宜: false, 诸事皆宜: false };
    const 部分宜 = { 宜: ["事项甲"], 忌: [] as string[], 诸事不宜: false, 诸事皆宜: false };
    expect(创建每日宜忌展示(全忌)).toEqual({ 日宜: [], 日忌: ["诸事不宜"] });
    expect(创建每日宜忌展示(全宜)).toEqual({ 日宜: ["诸事皆宜"], 日忌: [] });
    expect(创建每日宜忌展示(部分忌)).toEqual({ 日宜: [], 日忌: ["诸事不宜"] });
    expect(创建每日宜忌展示(有宜有忌)).toEqual({ 日宜: ["事项甲"], 日忌: ["事项乙"] });
    expect(创建每日宜忌展示(双空)).toEqual({ 日宜: [], 日忌: [] });
    expect(创建每日宜忌展示(部分宜)).toEqual({ 日宜: ["事项甲"], 日忌: [] });
    expect(全忌.忌).toEqual(["事项甲", "事项乙"]);
    expect(全宜.宜).toEqual(["事项甲", "事项乙"]);
    expect(部分忌.忌).toEqual(["事项甲"]);
  });

  it.each(["立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"] as const)(
    "%s前后使用统一节气月具体交接时刻",
    (名称) => {
      const 交节 = 获取指定节气(2026, 名称);
      const 交节前 = 平移时间(交节, -60);
      const 交节后 = 平移时间(交节, 60);
      expect(计算干支(交节前).月建).not.toBe(计算干支(交节后).月建);
      expect(计算每日宜忌(交节前).命中条件).toBeDefined();
      expect(计算每日宜忌(交节后).命中条件).toBeDefined();
    },
  );
});
