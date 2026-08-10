import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { LunarUtil } from "lunar-typescript";
import { describe, expect, it } from "vitest";
import { 天干, 地支 } from "../src/历法/干支";
import { 创建北京时间 } from "../src/历法/时间";
import { 创建十二时辰概览 } from "../src/历法/十二时辰";
import { 计算时柱, type 时支 } from "../src/历法/真太阳时";
import { 解析现代时辰宜忌, 现代时辰宜忌来源 } from "../src/规则/现代时辰宜忌";
import { 解析配置 } from "../src/规则/配置读取";
import { 解析时辰吉凶配置 } from "../src/规则/时辰吉凶";
import { 解析详细时辰配置 } from "../src/规则/详细时辰";

const 配置文本 = readFileSync(resolve(process.cwd(), "配置", "现代时辰宜忌.txt"), "utf8");
const 本地配置 = 解析现代时辰宜忌(配置文本);
const 六十甲子 = Array.from({ length: 60 }, (_, 索引) => `${天干[索引 % 10]}${地支[索引 % 12]}`);

function 上游列表(列表: string[]): string[] {
  return 列表.length === 1 && 列表[0] === "无" ? [] : 列表;
}

function 读配置(文件名: string) {
  return 解析配置(文件名, readFileSync(resolve(process.cwd(), "配置", 文件名), "utf8"));
}

const 吉凶配置 = 解析时辰吉凶配置(读配置("时辰吉凶.txt")).配置;
const 详细配置 = 解析详细时辰配置([读配置("时辰神煞.txt"), 读配置("时辰宜忌.txt")]).配置;

describe("现代时辰宜忌本地快照", () => {
  it("固定迁移源版本、中文来源注释和MIT资料齐全", () => {
    const 包信息 = JSON.parse(readFileSync(resolve(process.cwd(), "node_modules", "lunar-typescript", "package.json"), "utf8"));
    const 许可 = readFileSync(resolve(process.cwd(), "第三方资料", "lunar-typescript-MIT-LICENSE.txt"), "utf8");
    const 来源 = readFileSync(resolve(process.cwd(), "第三方资料", "现代时辰宜忌来源说明.md"), "utf8");
    expect(包信息.version).toBe("1.8.6");
    expect(配置文本).toContain("# 数据来源：lunar-typescript 1.8.6 时辰宜忌数据");
    expect(配置文本).toContain("# 使用范围：仅用于“现代黄历宜忌体系”的时辰宜忌");
    expect(许可).toContain("Copyright (c) 2020 6tail");
    expect(许可).toContain("MIT License");
    expect(来源).toContain("日宜忌继续使用项目自主规则");
  });

  it("完整覆盖60日乘12时且没有重复或缺项", () => {
    expect(本地配置.组合数).toBe(720);
    const 数据行 = 配置文本.split(/\r?\n/u).filter((行) => /^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日/u.test(行));
    expect(数据行).toHaveLength(720);
    expect(new Set(数据行.map((行) =>行.match(/^(.+?时)：/u)?.[1])).size).toBe(720);
  });

  it("720组逐项与固定lunar-typescript 1.8.6零差异", () => {
    for (const 日柱 of 六十甲子) {
      for (const 时支 of 地支 as readonly 时支[]) {
        const 时柱 = 计算时柱(日柱, 时支);
        const 本地 = 本地配置.查询(日柱, 时支);
        expect(new Set(本地.时宜), `${日柱}日${时支}时宜`).toEqual(new Set(上游列表(LunarUtil.getTimeYi(日柱, 时柱))));
        expect(new Set(本地.时忌), `${日柱}日${时支}时忌`).toEqual(new Set(上游列表(LunarUtil.getTimeJi(日柱, 时柱))));
        expect(本地.来源).toBe(现代时辰宜忌来源);
      }
    }
  });

  it("夜子读取当日日柱，早子读取次日日柱", () => {
    const 概览 = 创建十二时辰概览(创建北京时间(2026, 8, 10, 0, 30), "北京时间", null, 吉凶配置, 详细配置);
    const [夜子, 早子] = 概览.项目[0].时段;
    expect(夜子.日柱).toBe("乙卯");
    expect(早子.日柱).toBe("丙辰");
    expect(夜子.详情.现代时宜).toEqual(本地配置.查询("乙卯", "子").时宜);
    expect(早子.详情.现代时宜).toEqual(本地配置.查询("丙辰", "子").时宜);
    expect(夜子.详情.现代时宜).not.toEqual(早子.详情.现代时宜);
  });

  it("北京时间和真太阳时均按各时段最终日柱与时支查本地表", () => {
    const 案例 = [
      创建十二时辰概览(创建北京时间(2026, 8, 9, 12), "北京时间", null, 吉凶配置, 详细配置),
      创建十二时辰概览(创建北京时间(2026, 8, 9, 1), "真太阳时", 60, 吉凶配置, 详细配置),
      创建十二时辰概览(创建北京时间(2026, 8, 9, 23), "真太阳时", 150, 吉凶配置, 详细配置),
    ];
    for (const 概览 of 案例) {
      for (const 时段 of 概览.项目.flatMap((项目) => 项目.时段)) {
        const 预期 = 本地配置.查询(时段.日柱, 时段.时支);
        expect(时段.详情.现代时宜).toEqual(预期.时宜);
        expect(时段.详情.现代时忌).toEqual(预期.时忌);
      }
    }
  });

  it.each([[2026, 8, 9], [2026, 8, 10], [2026, 8, 13], [2026, 8, 19]])(
    "%i-%i-%i十二时辰都有丰富本地宜忌和明确来源",
    (年, 月, 日) => {
      const 概览 = 创建十二时辰概览(创建北京时间(年, 月, 日, 12), "北京时间", null, 吉凶配置, 详细配置);
      const 时段 = 概览.项目.flatMap((项目) => 项目.时段);
      expect(时段).toHaveLength(13);
      expect(时段.every((段) => 段.详情.现代时宜.length + 段.详情.现代时忌.length > 0)).toBe(true);
      expect(时段.every((段) => 段.详情.现代来源 === "现代黄历宜忌体系")).toBe(true);
    },
  );

  it("正式运行源码不调用上游时辰宜忌API，调用只存在迁移脚本和对照测试", () => {
    function 源码文件(目录: string): string[] {
      return readdirSync(目录, { withFileTypes: true }).flatMap((项目) => {
        const 路径 = resolve(目录, 项目.name);
        return 项目.isDirectory() ? 源码文件(路径) : 项目.name.endsWith(".ts") ? [路径] : [];
      });
    }
    const 正式源码 = 源码文件(resolve(process.cwd(), "src")).map((路径) => readFileSync(路径, "utf8")).join("\n");
    for (const 禁止接口 of ["getTimeYi", "getTimeJi", "LunarTime.getYi", "LunarTime.getJi", "DAY_YI_JI"]) {
      expect(正式源码).not.toContain(禁止接口);
    }
  });
});
