import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { 创建十二时辰概览, type 时辰概览段 } from "../src/历法/十二时辰";
import { 创建北京时间, 平移时间 } from "../src/历法/时间";
import { 转换为农历 } from "../src/历法/农历";
import { 计算当前历时 } from "../src/当前历时";
import { 选出查看时辰 } from "../src/界面/时辰查看";
import { 判断全部时辰规则 } from "../src/规则/时辰规则";
import { 解析配置 } from "../src/规则/配置读取";

const 规则文件 = ["杀师时.txt", "造葬杀风水师时.txt", "逐月杀风水师时.txt"];
const 全部配置 = 规则文件.map((文件名) =>
  解析配置(文件名, readFileSync(resolve(process.cwd(), "配置", 文件名), "utf8")),
);
const 时刻 = (年: number, 月: number, 日: number, 时 = 12, 分 = 0) => 创建北京时间(年, 月, 日, 时, 分);
type 规则日支 = Parameters<typeof 判断全部时辰规则>[1];

function 概览(年: number, 月: number, 日: number, 时 = 12, 分 = 0) {
  return 创建十二时辰概览(时刻(年, 月, 日, 时, 分), "北京时间", null, null, null, 全部配置);
}

function 所有时段(结果: ReturnType<typeof 概览>): 时辰概览段[] {
  return 结果.项目.flatMap((项目) => 项目.时段);
}

function 找时段(结果: ReturnType<typeof 概览>, 键: string): 时辰概览段 {
  const 时段 = 所有时段(结果).find((候选) => 候选.键 === 键);
  if (!时段) throw new Error(`找不到${键}时段`);
  return 时段;
}

describe("具体时辰风水禁忌联动", () => {
  it("每个时段都携带三项可扩展规则且点击不同时间会切换结果", () => {
    const 当日概览 = 概览(2026, 8, 15);
    expect(所有时段(当日概览).every((时段) => 时段.风水禁忌.length === 3)).toBe(true);
    expect(找时段(当日概览, "丑").风水禁忌).not.toEqual(找时段(当日概览, "寅").风水禁忌);
  });

  it("未来日期的同一时辰会按新日期重新计算", () => {
    const 八月十五午时 = 找时段(概览(2026, 8, 15), "午");
    const 八月十六午时 = 找时段(概览(2026, 8, 16), "午");
    expect(八月十五午时.日柱).not.toBe(八月十六午时.日柱);
    expect(八月十五午时.风水禁忌).not.toEqual(八月十六午时.风水禁忌);
  });

  it("夜子与早子分别使用午夜前后日支和各自农历月份", () => {
    const 当日概览 = 概览(2026, 8, 10);
    const 夜子 = 找时段(当日概览, "夜子");
    const 早子 = 找时段(当日概览, "早子");
    const 夜子时间 = 时刻(2026, 8, 9, 23, 30);
    const 早子时间 = 时刻(2026, 8, 10, 0, 30);
    expect(夜子.风水禁忌).toEqual(判断全部时辰规则(全部配置, 夜子.日柱[1] as 规则日支, "子", 转换为农历(夜子时间).月));
    expect(早子.风水禁忌).toEqual(判断全部时辰规则(全部配置, 早子.日柱[1] as 规则日支, "子", 转换为农历(早子时间).月));
    expect(夜子.日柱).not.toBe(早子.日柱);
  });

  it("逐月规则读取具体时段所在的农历月，十月显示无此规则", () => {
    let 十月日期 = 时刻(2026, 10, 1);
    while (转换为农历(十月日期).月 !== 10) 十月日期 = 平移时间(十月日期, 24 * 60 * 60);
    const 十月午时 = 找时段(概览(十月日期.年, 十月日期.月, 十月日期.日), "午");
    expect(十月午时.风水禁忌.find((规则) => 规则.名称 === "逐月杀风水师时")).toMatchObject({
      状态: "无规则",
      说明: "十月明确无此规则",
    });
  });

  it("北京时间和真太阳时都让当前时段规则与最终时间保持一致", () => {
    const 查询时刻 = 时刻(2026, 8, 9, 1, 0);
    const 北京 = 计算当前历时(查询时刻, "北京时间", 60, 全部配置);
    const 真太阳 = 计算当前历时(查询时刻, "真太阳时", 60, 全部配置);
    const 北京当前 = 北京.十二时辰.项目.flatMap((项目) => 项目.时段).find((时段) => 时段.当前);
    const 真太阳当前 = 真太阳.十二时辰.项目.flatMap((项目) => 项目.时段).find((时段) => 时段.当前);
    expect(北京当前?.风水禁忌).toEqual(北京.时辰规则);
    expect(真太阳当前?.风水禁忌).toEqual(真太阳.时辰规则);
    expect(真太阳.最终.最终时间.日).not.toBe(北京.最终.最终时间.日);
    expect(真太阳当前?.风水禁忌).not.toEqual(北京当前?.风水禁忌);
  });

  it("手动查看的禁忌不被分钟刷新抢回，恢复当前时辰后重新自动跟随", () => {
    const 刷新前 = 所有时段(概览(2026, 8, 15, 12, 10));
    const 刷新后 = 所有时段(概览(2026, 8, 15, 12, 11));
    const 手动规则 = 选出查看时辰(刷新前, "戌")?.风水禁忌;
    expect(选出查看时辰(刷新后, "戌")?.风水禁忌).toEqual(手动规则);
    expect(选出查看时辰(刷新后, null)?.当前).toBe(true);
    expect(选出查看时辰(刷新后, null)?.键).toBe("午");
  });
});
