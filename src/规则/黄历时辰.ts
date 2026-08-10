import { LunarUtil } from "lunar-typescript";

export interface 黄历时辰宜忌 {
  时宜: string[];
  时忌: string[];
  依据: string;
}

function 去除无占位(条目: string[]): string[] {
  return [...new Set(条目.filter((名称) => 名称 && 名称 !== "无"))];
}

/**
 * 只调用接受“日干支 + 时干支”的低层接口。
 * 日柱和时柱必须由项目统一算法先行确定，第三方库不得重新推导日界。
 */
export function 获取黄历时辰宜忌(日柱: string, 时柱: string): 黄历时辰宜忌 {
  return {
    时宜: 去除无占位(LunarUtil.getTimeYi(日柱, 时柱)),
    时忌: 去除无占位(LunarUtil.getTimeJi(日柱, 时柱)),
    依据: "lunar-typescript 1.8.6 时辰宜忌数据（输入采用本项目日柱、时柱）",
  };
}
