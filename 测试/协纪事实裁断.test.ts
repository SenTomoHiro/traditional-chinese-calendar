import { describe, expect, it } from "vitest";
import { 创建北京时间, 计算历法 } from "../src/历法";
import { 宜忌等第条件分支, 宜忌等第表, 匹配宜忌等第 } from "../src/择日/协纪裁断";
import { 协纪规则目录, 展开事实名称, 计算协纪日事实 } from "../src/择日/协纪事实";

describe("协纪辨方书 X01—X68 事实目录", () => {
  const 找日期 = (断言: (事实: ReturnType<typeof 计算协纪日事实>, 时间: ReturnType<typeof 创建北京时间>) => boolean) => {
    for (let 时戳 = Date.UTC(2025, 0, 1); 时戳 < Date.UTC(2028, 0, 1); 时戳 += 86_400_000) {
      const 日期 = new Date(时戳);
      const 时间 = 创建北京时间(日期.getUTCFullYear(), 日期.getUTCMonth() + 1, 日期.getUTCDate(), 12);
      const 事实 = 计算协纪日事实(时间);
      if (断言(事实, 时间)) return { 事实, 时间 };
    }
    throw new Error("测试范围内未找到所需日期");
  };
  it("X01—X68 保持稳定，并为六等表依赖追加 X69—X76", () => {
    expect(协纪规则目录).toHaveLength(76);
    expect(协纪规则目录.map((项) => 项.id)).toEqual(Array.from({ length: 76 }, (_, i) => `X${String(i + 1).padStart(2, "0")}`));
    expect(协纪规则目录.every((项) => 项.名称 && 项.域 && 项.输入 && 项.起例 && 项.来源 && 项.校勘状态)).toBe(true);
    expect(协纪规则目录.filter((项) => 项.校勘状态 === "待校")).toHaveLength(0);
    expect(协纪规则目录.filter((项) => 项.校勘状态 === "部分已核").map((项) => 项.id)).toEqual(["X15", "X63"]);
  });

  it("六等表追加事实均有正反日期且消费正式历法入口", () => {
    const 命中计数 = new Map(Array.from({ length: 8 }, (_, i) => [`X${69 + i}`, 0]));
    let 日期数 = 0;
    for (let 时戳 = Date.UTC(2025, 0, 1); 时戳 < Date.UTC(2027, 0, 1); 时戳 += 86_400_000) {
      const 日期 = new Date(时戳); 日期数 += 1;
      for (const 事实 of 计算协纪日事实(创建北京时间(日期.getUTCFullYear(), 日期.getUTCMonth() + 1, 日期.getUTCDate(), 12))) {
        if (命中计数.has(事实.id)) 命中计数.set(事实.id, (命中计数.get(事实.id) ?? 0) + 1);
      }
    }
    expect([...命中计数.values()].every((数) => 数 > 0 && 数 < 日期数)).toBe(true);
  });

  it("同位异名只产生一个事实，名称可按事项表展开", () => {
    const 事实 = 计算协纪日事实(创建北京时间(2026, 9, 26, 12));
    const 月破 = 事实.filter((项) => 项.id === "X02");
    expect(月破).toHaveLength(1);
    expect(月破[0].别名).toEqual(["破日", "月破", "大耗"]);
    expect(展开事实名称(月破)).toEqual(["破日", "月破", "大耗"]);
  });

  it("申月已知案例能命中成日天喜、月厌、四德与祈福诸神", () => {
    const 八月十日 = 展开事实名称(计算协纪日事实(创建北京时间(2026, 8, 10, 12)));
    expect(八月十日).toEqual(expect.arrayContaining(["成日", "天喜", "月厌", "三合"]));
    const 八月十二日 = 展开事实名称(计算协纪日事实(创建北京时间(2026, 8, 12, 12)));
    expect(八月十二日).toEqual(expect.arrayContaining(["开日", "灾煞", "天德合"]));
  });

  it("普通农历月计算长短星，闰月不擅自沿用", () => {
    expect(展开事实名称(计算协纪日事实(创建北京时间(2026, 2, 23, 12)))).toContain("长星");
    expect(计算协纪日事实(创建北京时间(2025, 8, 1, 12)).some((项) => 项.id === "X63")).toBe(false);
  });

  it("阴阳不将只接入可确认格，六月戊午逐阵明确排除", () => {
    const 不将 = 找日期((事实) => 事实.some((项) => 项.id === "X15")).事实;
    expect(不将.find((项) => 项.id === "X15")?.命中证据).toContain("阴阳不将表列");
    expect(展开事实名称(不将)).toContain("不将");
    const 六月戊午 = 找日期((_事实, 时间) => {
      const 历法 = 计算历法(时间);
      return 历法.月建 === "未" && 历法.日柱 === "戊午";
    }).事实;
    expect(六月戊午.some((项) => 项.id === "X15")).toBe(false);
  });

  it("癸亥无禄不被任何填实条件解除", () => {
    const 癸亥 = 找日期((事实) => 事实.some((项) => 项.id === "X59" && 项.命中证据.includes("癸亥"))).事实;
    expect(癸亥.find((项) => 项.id === "X59")?.命中证据).toContain("癸亥永不填实");
  });
});

describe("卷十宜忌等第表与裁断", () => {
  it("完整编译 7×12 共 84 个物理格", () => {
    expect(宜忌等第表).toHaveLength(84);
    expect(宜忌等第表.filter((项) => 项.行 === "表头")).toHaveLength(12);
    expect(宜忌等第表.find((项) => 项.行 === "次" && 项.列 === "闭日")?.规范值).toContain("王日");
  });

  it("全部非空条件格已展开为机器分支且每支可匹配", () => {
    expect(宜忌等第条件分支.length).toBeGreaterThan(50);
    const 非空条件格 = 宜忌等第表
      .filter((项) => 项.行 !== "表头" && 项.列 !== "裁断" && 项.规范值 !== null)
      .map((项) => `${项.行}/${项.列}`)
      .sort();
    const 已编译格 = [...new Set(宜忌等第条件分支.map((项) => `${项.等第}/${项.列}`))].sort();
    expect(已编译格).toEqual(非空条件格);
    for (const 分支 of 宜忌等第条件分支) {
      const 结果 = 匹配宜忌等第({ 月建: 分支.月[0], 命中: new Set(分支.条件), 有德: false });
      expect(结果, `${分支.等第}/${分支.列}/${分支.月}/${分支.条件.join("+")}`).not.toBeNull();
    }
  });

  it("上次等有德从宜，无德宜忌并注", () => {
    const 命中 = new Set(["开日", "灾煞"]);
    expect(匹配宜忌等第({ 月建: "申", 命中, 有德: true })?.状态).toBe("注宜");
    expect(匹配宜忌等第({ 月建: "申", 命中, 有德: false })?.状态).toBe("宜忌并注");
  });

  it("下下等遇德仍诸事皆忌", () => {
    const 命中 = new Set(["月破", "月厌", "灾煞", "天德合"]);
    expect(匹配宜忌等第({ 月建: "酉", 命中, 有德: true })).toMatchObject({ 等第: "下下", 状态: "诸事皆忌" });
  });
});
