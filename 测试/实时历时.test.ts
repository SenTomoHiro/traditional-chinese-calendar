import { afterEach, describe, expect, it, vi } from "vitest";
import {
  创建分钟实时更新器,
  创建实时查询时间,
  创建手动查询时间,
  刷新实时查询时间,
  计算下个分钟边界等待,
} from "../src/实时历时";
import { 创建北京时间 } from "../src/历法/时间";

afterEach(() => {
  vi.useRealTimers();
});

describe("每分钟实时更新", () => {
  it("默认使用当前真实时间并对齐下一个分钟边界", () => {
    expect(创建实时查询时间(创建北京时间(2026, 8, 10, 9, 7))).toEqual({
      模式: "实时",
      时间: "09:07",
    });
    expect(计算下个分钟边界等待(30_250)).toBe(29_750);
    expect(计算下个分钟边界等待(60_000)).toBe(60_000);
  });

  it("每次触发都重新读取真实时间而不是在旧时间上加一分钟", async () => {
    vi.useFakeTimers();
    let 当前毫秒 = 30_000;
    const 已更新时间: number[] = [];
    const 更新器 = 创建分钟实时更新器((毫秒) => 已更新时间.push(毫秒), () => 当前毫秒);

    更新器.启动();
    当前毫秒 = 61_500;
    await vi.advanceTimersByTimeAsync(30_000);
    当前毫秒 = 180_200;
    await vi.advanceTimersByTimeAsync(58_500);

    expect(已更新时间).toEqual([61_500, 180_200]);
    更新器.停止();
  });

  it("手动查询时间不会被实时刷新覆盖", () => {
    const 手动状态 = 创建手动查询时间("21:35");
    expect(刷新实时查询时间(手动状态, 创建北京时间(2026, 8, 10, 9, 8))).toBe(手动状态);
  });

  it("返回实时模式后会重新采用当前真实时间", () => {
    const 恢复状态 = 创建实时查询时间(创建北京时间(2026, 8, 10, 9, 8));
    expect(刷新实时查询时间(恢复状态, 创建北京时间(2026, 8, 10, 9, 9))).toEqual({
      模式: "实时",
      时间: "09:09",
    });
  });

  it("重复启动不会创建多个定时器，停止后会正常清理", () => {
    vi.useFakeTimers();
    const 更新器 = 创建分钟实时更新器(() => undefined, () => 10_000);
    更新器.启动();
    更新器.启动();
    expect(vi.getTimerCount()).toBe(1);
    expect(更新器.是否运行()).toBe(true);

    更新器.停止();
    expect(vi.getTimerCount()).toBe(0);
    expect(更新器.是否运行()).toBe(false);
  });
});
