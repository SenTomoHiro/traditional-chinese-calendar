import { 地支 } from "./干支";
import type { 月建 } from "./节气";

export const 十二值星 = ["建", "除", "满", "平", "定", "执", "破", "危", "成", "收", "开", "闭"] as const;
export type 值星 = (typeof 十二值星)[number];

export function 计算值星(月建: 月建, 日支: (typeof 地支)[number]): 值星 {
  const 月建位置 = 地支.indexOf(月建);
  const 日支位置 = 地支.indexOf(日支);
  return 十二值星[(日支位置 - 月建位置 + 12) % 12];
}
