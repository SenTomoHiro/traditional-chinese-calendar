export interface 年月 {
  年: number;
  月: number;
}

export interface 日历状态 extends 年月 {
  所选日期: Date;
}

export const 星期名称 = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
] as const;

export const 星期短名 = ["日", "一", "二", "三", "四", "五", "六"] as const;

export function 获取某月天数(年: number, 月: number): number {
  return new Date(年, 月 + 1, 0).getDate();
}

export function 获取某月首日星期(年: number, 月: number): number {
  return new Date(年, 月, 1).getDay();
}

export function 移动月份(年: number, 月: number, 偏移: number): 年月 {
  const 日期 = new Date(年, 月 + 偏移, 1);
  return { 年: 日期.getFullYear(), 月: 日期.getMonth() };
}

export function 移动日期(日期: Date, 偏移天数: number): Date {
  return new Date(日期.getFullYear(), 日期.getMonth(), 日期.getDate() + 偏移天数);
}

export function 创建月历格(年: number, 月: number): Array<number | null> {
  const 首日位置 = 获取某月首日星期(年, 月);
  const 天数 = 获取某月天数(年, 月);
  return [
    ...Array.from<null>({ length: 首日位置 }).fill(null),
    ...Array.from({ length: 天数 }, (_, 索引) => 索引 + 1),
  ];
}

export function 是同一天(左: Date, 右: Date): boolean {
  return (
    左.getFullYear() === 右.getFullYear() &&
    左.getMonth() === 右.getMonth() &&
    左.getDate() === 右.getDate()
  );
}

export function 选择日期(_状态: 日历状态, 日期: Date): 日历状态 {
  return {
    年: 日期.getFullYear(),
    月: 日期.getMonth(),
    所选日期: new Date(日期.getFullYear(), 日期.getMonth(), 日期.getDate()),
  };
}

export function 格式化公历日期(日期: Date): string {
  return `${日期.getFullYear()}年${日期.getMonth() + 1}月${日期.getDate()}日`;
}
