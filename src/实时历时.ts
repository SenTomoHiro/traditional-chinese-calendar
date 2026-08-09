import { 格式化时分, type 北京时间 } from "./历法/时间";

export type 查询时间模式 = "实时" | "手动";

export interface 查询时间状态 {
  模式: 查询时间模式;
  时间: string;
}

export function 创建实时查询时间(当前时间: 北京时间): 查询时间状态 {
  return { 模式: "实时", 时间: 格式化时分(当前时间) };
}

export function 创建手动查询时间(时间: string): 查询时间状态 {
  return { 模式: "手动", 时间 };
}

export function 刷新实时查询时间(
  当前状态: 查询时间状态,
  当前时间: 北京时间,
): 查询时间状态 {
  return 当前状态.模式 === "实时" ? 创建实时查询时间(当前时间) : 当前状态;
}

export function 计算下个分钟边界等待(当前毫秒: number): number {
  const 分钟内毫秒 = ((当前毫秒 % 60_000) + 60_000) % 60_000;
  return 60_000 - 分钟内毫秒;
}

export interface 分钟实时更新器 {
  启动(): void;
  停止(): void;
  是否运行(): boolean;
}

export function 创建分钟实时更新器(
  更新时间: (当前毫秒: number) => void,
  读取当前毫秒: () => number = Date.now,
): 分钟实时更新器 {
  let 已启动 = false;
  let 定时器: ReturnType<typeof setTimeout> | null = null;

  const 安排下次更新 = (): void => {
    if (!已启动 || 定时器 !== null) return;
    定时器 = setTimeout(() => {
      定时器 = null;
      const 当前毫秒 = 读取当前毫秒();
      更新时间(当前毫秒);
      安排下次更新();
    }, 计算下个分钟边界等待(读取当前毫秒()));
  };

  return {
    启动() {
      if (已启动) return;
      已启动 = true;
      安排下次更新();
    },
    停止() {
      已启动 = false;
      if (定时器 !== null) clearTimeout(定时器);
      定时器 = null;
    },
    是否运行() {
      return 已启动;
    },
  };
}
