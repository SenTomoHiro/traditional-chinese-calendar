import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { 初始化时辰配置 } from "../src/当前历时";
import { 计算详细时辰 } from "../src/规则/详细时辰";
import { 读取全部配置 } from "../src/规则/配置读取";

const 禁止接口 = [
  "getDayYi", "getDayJi", "getTimeYi", "getTimeJi", "getYi(", "getJi(",
  "getDayTianShen", "getTianShen", "getJiShen", "getXiongSha", "getChong", "getSha(", "getChongGan",
];

function 读取源码文件(目录: string): string[] {
  return readdirSync(目录, { withFileTypes: true }).flatMap((项目) => {
    const 路径 = resolve(目录, 项目.name);
    return 项目.isDirectory() ? 读取源码文件(路径) : 项目.name.endsWith(".ts") ? [路径] : [];
  });
}

describe("第三方黄历依赖静态审计", () => {
  it("正式业务源码不再调用任何第三方黄历结果接口", () => {
    const 源码 = 读取源码文件(resolve(process.cwd(), "src")).map((路径) => readFileSync(路径, "utf8")).join("\n");
    for (const 接口 of 禁止接口) expect(源码, `发现禁止接口 ${接口}`).not.toContain(接口);
  });

  it("时辰宜忌只使用项目中文配置的明确时级条件", () => {
    const 配置结果 = 读取全部配置();
    const 配置 = 初始化时辰配置(配置结果).详细时辰;
    const 路空时 = 计算详细时辰(配置, "乙卯", "壬午", "明堂", "吉");
    expect(路空时.凶煞).toContain("路空");
    expect(路空时.时忌).toContain("出行");
    expect(路空时.依据).toContain("项目中文配置");
    expect(路空时.依据).not.toContain("lunar-typescript");
  });
});
