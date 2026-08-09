import { 转为公历, type 北京时间 } from "./时间";

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
