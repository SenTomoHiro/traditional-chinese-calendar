import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const 文档名称 = ["README.md", "开发规则.md", "待确认规则.md", "GPT项目提示词.txt"];
const 文档内容 = 文档名称.map((名称) => [名称, readFileSync(resolve(process.cwd(), 名称), "utf8")] as const);

describe("项目换日规则文档", () => {
  it.each(文档内容)("%s 已同步为子时23点换日", (_名称, 内容) => {
    expect(内容).toContain("23:00");
    expect(内容).not.toContain("0:00 换日");
  });

  it("开发规则明确区分公历今天与传统历法计算日", () => {
    const 开发规则 = 文档内容.find(([名称]) => 名称 === "开发规则.md")?.[1] ?? "";
    expect(开发规则).toContain("公历月历日期和“今天”标记仍按普通北京时间公历日期显示");
    expect(开发规则).toContain("真太阳时模式按真太阳时 23:00 换日");
  });
});
