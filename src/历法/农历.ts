import { 计算传统节日, type 传统节日结果 } from "../规则/传统节日";
import { 平移时间, 转为公历, type 北京时间 } from "./时间";

export interface 农历日期 {
  年: number;
  月: number;
  日: number;
  是否闰月: boolean;
  月名: string;
  日名: string;
  显示: string;
}

export function 转换为农历(时间: 北京时间): 农历日期 {
  const 农历 = 转为公历(时间).getLunar();
  const 是否闰月 = 农历.getMonth() < 0;
  const 月名 = `${农历.getMonthInChinese()}月`;
  const 日名 = 农历.getDayInChinese();

  return {
    年: 农历.getYear(),
    月: Math.abs(农历.getMonth()),
    日: 农历.getDay(),
    是否闰月,
    月名,
    日名,
    显示: `${月名}${日名}`,
  };
}

export function 获取传统节日分类(时间: 北京时间): 传统节日结果 {
  return 计算传统节日(时间, 转换为农历(时间), 转换为农历(平移时间(时间, 86_400)));
}

/** 正式运行只读取本地中文配置与本地动态规则。 */
export function 获取传统节日(时间: 北京时间): string[] {
  return 获取传统节日分类(时间).全部;
}
