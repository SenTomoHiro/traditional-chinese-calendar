import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { 解析配置 } from "../src/规则/配置读取";

describe("中文配置读取", () => {
  it("解析中文冒号", () => {
    const 结果 = 解析配置("示例.txt", "正月初九：玉皇上帝圣诞");
    expect(结果.规则[0]).toMatchObject({ 条件: "正月初九", 内容: "玉皇上帝圣诞" });
  });

  it("兼容英文冒号", () => {
    const 结果 = 解析配置("示例.txt", "正月初九:玉皇上帝圣诞");
    expect(结果.规则).toHaveLength(1);
  });

  it("忽略空行和注释", () => {
    const 结果 = 解析配置("示例.txt", "\n# 这是一条备注\n\n正月：申日\n");
    expect(结果.规则).toHaveLength(1);
    expect(结果.错误).toHaveLength(0);
  });

  it("错误行不影响其他规则，并保留定位信息", () => {
    const 结果 = 解析配置("示例.txt", "错误的一行\n正月：申日");
    expect(结果.规则).toHaveLength(1);
    expect(结果.错误[0]).toEqual({
      文件名: "示例.txt",
      行号: 1,
      原文: "错误的一行",
      信息: "缺少冒号分隔符",
    });
  });

  it("现有全部中文配置文件都能正常读取", () => {
    const 配置目录 = resolve(process.cwd(), "配置");
    const 文件列表 = readdirSync(配置目录).filter((名称) => 名称.endsWith(".txt"));
    expect(文件列表).toHaveLength(10);

    for (const 文件名 of 文件列表) {
      const 内容 = readFileSync(resolve(配置目录, 文件名), "utf8");
      const 结果 = 解析配置(文件名, 内容);
      expect(结果.规则.length, `${文件名} 应至少包含一条规则`).toBeGreaterThan(0);
      expect(结果.错误, `${文件名} 不应包含格式错误`).toEqual([]);
    }
  });
});
