import { describe, expect, it } from "vitest";
import { 计算生辰八字 } from "../src/生辰八字";
import { 分析八字, 计算十神 } from "../src/八字分析";
import { 创建北京时间 } from "../src/历法";

const 分析日 = (年: number, 月: number, 日: number) => 分析八字(计算生辰八字(创建北京时间(年, 月, 日, 12), "北京时间", null), "男");

describe("八字分析 B01—B11", () => {
  it("B01 十神按五行生克与阴阳计算", () => {
    expect(计算十神("己", "丙")).toBe("正印");
    expect(计算十神("己", "庚")).toBe("伤官");
  });

  it("B02 十神不随柱位猜测", () => {
    const 结果 = 分析日(2026, 2, 4);
    expect(结果.全局结构.泄.some((项) => 项.includes("月柱庚伤官"))).toBe(true);
    expect(结果.全局结构.克.some((项) => 项.includes("月柱庚"))).toBe(false);
  });

  it("B03 寅月甲日列通根和建禄候选", () => {
    const 结果 = 分析日(2026, 2, 9);
    expect(结果.通根.some((项) => 项.includes("日柱寅中本气甲"))).toBe(true);
    expect(结果.格局候选.some((项) => 项.名称 === "建禄候选")).toBe(true);
    expect(结果.全局结构.克.some((项) => 项.includes("月柱庚七杀"))).toBe(true);
  });

  it("B04 日支有禄不冒充建禄月令", () => {
    const 结果 = 分析日(2026, 4, 10);
    expect(结果.通根.some((项) => 项.includes("日柱寅"))).toBe(true);
    expect(结果.格局候选.some((项) => 项.名称 === "建禄候选")).toBe(false);
    expect(计算十神("甲", "壬")).toBe("偏印");
  });

  it("B05 阴干不自动终判月刃", () => {
    const 结果 = 分析日(2026, 2, 10);
    expect(结果.通根.some((项) => 项.includes("日柱卯中本气乙"))).toBe(true);
    expect(结果.格局候选.some((项) => 项.名称 === "月刃候选")).toBe(false);
  });

  it("B06 杀印并见不靠名称编造", () => {
    const 结果 = 分析日(2026, 2, 7);
    expect(计算十神("壬", "庚")).toBe("偏印");
    expect(计算十神("壬", "丙")).toBe("偏财");
    expect(结果.藏干.some((项) => 项.藏干.some((藏) => 藏.干 === "癸" && 藏.十神 === "劫财"))).toBe(true);
  });

  it("B07 申月藏干分别为偏财七杀食神且未透不冒充透干", () => {
    const 结果 = 分析日(2026, 8, 10);
    const 月藏 = 结果.藏干.find((项) => 项.位置 === "月柱")?.藏干.map((项) => `${项.干}${项.十神}`);
    expect(月藏).toEqual(["庚偏财", "壬七杀", "戊食神"]);
    expect(结果.透干.some((项) => /庚|壬|戊/u.test(项))).toBe(false);
  });

  it("B08 官印财候选与伤官破格线索分层", () => {
    const 结果 = 分析日(2026, 8, 9);
    expect(结果.藏干.find((项) => 项.位置 === "月柱")?.藏干.map((项) => 项.十神)).toEqual(["正官", "正印", "正财"]);
    const 官格 = 结果.格局候选.find((项) => 项.名称 === "正官格候选");
    expect(官格?.不利条件.some((项) => 项.includes("伤官"))).toBe(true);
    expect(官格?.人工复核.some((项) => 项.includes("印"))).toBe(true);
  });

  it("B09 通根只认实际藏干并保留冲关系", () => {
    const 结果 = 分析日(2026, 8, 8);
    expect(结果.通根.some((项) => 项.includes("日柱寅中本气甲"))).toBe(true);
    expect(结果.通根.some((项) => 项.includes("月柱申"))).toBe(false);
    expect(结果.地支关系.some((项) => 项.includes("寅") && 项.includes("申") && 项.includes("冲"))).toBe(true);
  });

  it("B10 格局用扶抑调候三栏互不合并", () => {
    const 结果 = 分析日(2026, 8, 9);
    expect(Object.keys(结果.三套取用说明)).toEqual(["格局用", "扶抑", "调候"]);
    expect(结果.调候.join("")).toContain("不把《穷通宝鉴》");
    expect(JSON.stringify(结果)).not.toMatch(/\d+%/u);
    expect(结果.三套取用说明.格局用).toContain("不作唯一终判");
  });

  it("B11 破格与救应只作为候选链并明确人工复核", () => {
    const 官格 = 分析日(2026, 8, 9).格局候选.find((项) => 项.名称 === "正官格候选");
    expect(官格).toBeDefined();
    expect(官格?.不利条件.length).toBeGreaterThan(0);
    expect(官格?.人工复核.length).toBeGreaterThan(0);
    expect(官格?.名称).toContain("候选");
  });
});
