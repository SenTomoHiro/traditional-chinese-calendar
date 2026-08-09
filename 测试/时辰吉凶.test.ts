import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { 解析配置 } from "../src/规则/配置读取";
import { 解析时辰吉凶配置, 值神名称, 计算时辰值神 } from "../src/规则/时辰吉凶";
import { 地支 } from "../src/历法/干支";

const 文件名 = "时辰吉凶.txt";
const 配置文本 = readFileSync(resolve(process.cwd(), "配置", 文件名), "utf8");
const 解析结果 = 解析时辰吉凶配置(解析配置(文件名, 配置文本));
const 配置 = 解析结果.配置;

describe("时辰吉凶中文配置", () => {
  it("配置文件可以正常读取", () => {
    expect(解析结果.错误).toEqual([]);
    expect(配置).not.toBeNull();
  });

  it.each([
    ["寅", "子"], ["申", "子"],
    ["卯", "寅"], ["酉", "寅"],
    ["辰", "辰"], ["戌", "辰"],
    ["巳", "午"], ["亥", "午"],
    ["子", "申"], ["午", "申"],
    ["丑", "戌"], ["未", "戌"],
  ] as const)("%s日从%s时起青龙", (日支, 起时) => {
    expect(配置?.青龙起时[日支]).toBe(起时);
    expect(计算时辰值神(配置, 日支, 起时)).toEqual({ 值神: "青龙", 吉凶: "吉" });
  });

  it("十二值神按配置完整循环", () => {
    expect(配置?.值神顺序).toEqual(值神名称);
    expect(地支.map((时支) => 计算时辰值神(配置, "寅", 时支).值神)).toEqual(值神名称);
  });

  it.each(["青龙", "明堂", "金匮", "天德", "玉堂", "司命"] as const)("%s判断为吉", (值神) => {
    expect(配置?.吉神).toContain(值神);
    expect(配置?.凶神).not.toContain(值神);
  });

  it.each(["天刑", "朱雀", "白虎", "天牢", "玄武", "勾陈"] as const)("%s判断为凶", (值神) => {
    expect(配置?.凶神).toContain(值神);
    expect(配置?.吉神).not.toContain(值神);
  });

  it("语义错误保留文件名、行号和原文且不抛出异常", () => {
    const 错误配置 = 解析配置(文件名, "寅日、申日：错误时\n值神：青龙\n吉：青龙\n凶：天刑");
    const 结果 = 解析时辰吉凶配置(错误配置);
    expect(结果.配置).toBeNull();
    expect(结果.错误[0]).toMatchObject({ 文件名, 行号: 1, 原文: "寅日、申日：错误时" });
    expect(计算时辰值神(结果.配置, "寅", "子")).toEqual({ 值神: "配置错误", 吉凶: "—" });
  });
});
