import { describe, expect, it } from "vitest";
import { 保存界面语言, 语言存储键, 读取界面语言 } from "../src/界面/语言";
function 创建存储(初值?: string) { const 数据 = new Map<string, string>(); if (初值) 数据.set(语言存储键, 初值); return { getItem: (键: string) => 数据.get(键) ?? null, setItem: (键: string, 值: string) => 数据.set(键, 值) }; }
describe("界面语言", () => { it("默认中文，且仅接受英文覆盖", () => { expect(读取界面语言(创建存储())).toBe("zh-CN"); expect(读取界面语言(创建存储("unexpected"))).toBe("zh-CN"); expect(读取界面语言(创建存储("en"))).toBe("en"); }); it("保存语言选择以供刷新后恢复", () => { const 存储 = 创建存储(); 保存界面语言("en", 存储); expect(读取界面语言(存储)).toBe("en"); }); });
