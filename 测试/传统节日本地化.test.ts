import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { Solar } from "lunar-typescript";
import { describe, expect, it } from "vitest";
import { 获取传统节日, 获取传统节日分类 } from "../src/历法/农历";
import { 创建北京时间 } from "../src/历法/时间";
import { 解析传统节日配置 } from "../src/规则/传统节日";

function 读取源码文件(目录: string): string[] {
  return readdirSync(目录).flatMap((名称) => {
    const 路径 = resolve(目录, 名称);
    return statSync(路径).isDirectory() ? 读取源码文件(路径) : 路径.endsWith(".ts") ? [路径] : [];
  });
}

describe("本地传统节日配置", () => {
  it("保留1.8.6的两类固定表、名称与顺序", () => {
    const 配置 = 解析传统节日配置(readFileSync(resolve(process.cwd(), "配置/传统节日.txt"), "utf8"));
    expect(配置.filter((项目) => 项目.分类 === "常用传统节日")).toHaveLength(8);
    expect(配置.filter((项目) => 项目.分类 === "其他传统民俗节日")).toHaveLength(27);
    expect(配置.flatMap((项目) => 项目.名称)).toEqual([
      "春节", "元宵节", "龙头节", "端午节", "七夕节", "中秋节", "重阳节", "腊八节",
      "接神日", "隔开日", "人日", "谷日", "顺星节", "天日", "地日", "天穿节", "填仓节", "正月晦",
      "中和节", "社日节", "上巳节", "分龙节", "会龙节", "天贶节", "观莲节", "五谷母节", "中元节",
      "财神节", "地藏节", "天灸日", "寒衣节", "十成节", "下元节", "驱傩日", "尾牙", "祭灶日",
    ]);
  });

  it.each([
    [2024, 2, 10, "春节"], [2024, 2, 24, "元宵节"], [2024, 3, 11, "龙头节"],
    [2024, 6, 10, "端午节"], [2024, 8, 10, "七夕节"], [2024, 9, 17, "中秋节"],
    [2024, 10, 11, "重阳节"], [2025, 1, 7, "腊八节"], [2024, 7, 29, "观莲节"],
  ])("%i-%i-%i 命中固定节日%s", (年, 月, 日, 名称) => {
    expect(获取传统节日(创建北京时间(年, 月, 日))).toContain(名称);
  });

  it.each([
    [2023, 1, 21, "除夕"], [2025, 1, 28, "除夕"], [2024, 4, 3, "寒食节"],
    [2024, 3, 15, "春社"], [2024, 9, 21, "秋社"], [2023, 4, 4, "寒食节"],
  ])("%i-%i-%i 命中动态节日%s", (年, 月, 日, 名称) => {
    expect(获取传统节日(创建北京时间(年, 月, 日))).toContain(名称);
  });

  it("内部分类保持常用与其他民俗边界", () => {
    const 结果 = 获取传统节日分类(创建北京时间(2024, 2, 10));
    expect(结果.常用传统节日).toEqual(["春节"]);
    expect(结果.其他传统民俗节日).toEqual([]);
  });

  it("正式源码不再调用上游传统节日结果接口", () => {
    const 命中 = 读取源码文件(resolve(process.cwd(), "src"))
      .filter((路径) => /\.get(?:Other)?Festivals\s*\(/u.test(readFileSync(路径, "utf8")));
    expect(命中).toEqual([]);
  });

  it("依赖版本与MIT许可保持冻结", () => {
    const 包 = JSON.parse(readFileSync(resolve(process.cwd(), "node_modules/lunar-typescript/package.json"), "utf8"));
    expect(包.version).toBe("1.8.6");
    expect(readFileSync(resolve(process.cwd(), "第三方资料/lunar-typescript-MIT-LICENSE.txt"), "utf8")).toContain("MIT License");
  });
});

describe("1900—2100传统节日零差异", () => {
  it("逐日与锁定的lunar-typescript 1.8.6名称、分类合并顺序完全一致", () => {
    const 开始 = Date.UTC(1900, 0, 1);
    const 结束 = Date.UTC(2100, 11, 31);
    for (let 毫秒 = 开始; 毫秒 <= 结束; 毫秒 += 86_400_000) {
      const 日期 = new Date(毫秒);
      const 年 = 日期.getUTCFullYear();
      const 月 = 日期.getUTCMonth() + 1;
      const 日 = 日期.getUTCDate();
      const 上游农历 = Solar.fromYmd(年, 月, 日).getLunar();
      const 上游 = [...上游农历.getFestivals(), ...上游农历.getOtherFestivals()];
      expect(获取传统节日(创建北京时间(年, 月, 日)), `${年}-${月}-${日}`).toEqual(上游);
    }
  }, 60_000);
});
