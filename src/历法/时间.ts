import { Solar } from "lunar-typescript";

/** 系统内统一使用的北京时间字段，避免浏览器所在时区改变历法结果。 */
export interface 北京时间 {
  年: number;
  月: number;
  日: number;
  时: number;
  分: number;
  秒: number;
}

export function 创建北京时间(
  年: number,
  月: number,
  日: number,
  时 = 12,
  分 = 0,
  秒 = 0,
): 北京时间 {
  return { 年, 月, 日, 时, 分, 秒 };
}

export function 转为公历(时间: 北京时间): Solar {
  return Solar.fromYmdHms(时间.年, 时间.月, 时间.日, 时间.时, 时间.分, 时间.秒);
}

export function 从公历读取时间(公历: Solar): 北京时间 {
  return {
    年: 公历.getYear(),
    月: 公历.getMonth(),
    日: 公历.getDay(),
    时: 公历.getHour(),
    分: 公历.getMinute(),
    秒: 公历.getSecond(),
  };
}

export function 比较北京时间(左: 北京时间, 右: 北京时间): number {
  const 左字段 = [左.年, 左.月, 左.日, 左.时, 左.分, 左.秒];
  const 右字段 = [右.年, 右.月, 右.日, 右.时, 右.分, 右.秒];
  for (let 索引 = 0; 索引 < 左字段.length; 索引 += 1) {
    const 差值 = 左字段[索引] - 右字段[索引];
    if (差值 !== 0) return 差值;
  }
  return 0;
}

export function 是同一公历日(左: 北京时间, 右: 北京时间): boolean {
  return 左.年 === 右.年 && 左.月 === 右.月 && 左.日 === 右.日;
}

export function 格式化时分(时间: 北京时间): string {
  return `${String(时间.时).padStart(2, "0")}:${String(时间.分).padStart(2, "0")}`;
}
