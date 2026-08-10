import { 转为公历, type 北京时间 } from "./时间";

/**
 * 每日宜忌采用 lunar-typescript 的节气精确月柱口径。
 * 该数据属于通行黄历数据层，不与项目的古籍日吉凶规则混作同一来源。
 */
export const 每日宜忌节气口径 = 2 as const;

export interface 每日宜忌结果 {
  宜: string[];
  忌: string[];
}

export function 计算每日宜忌(时间: 北京时间): 每日宜忌结果 {
  const 农历 = 转为公历(时间).getLunar();
  return {
    宜: 农历.getDayYi(每日宜忌节气口径),
    忌: 农历.getDayJi(每日宜忌节气口径),
  };
}
