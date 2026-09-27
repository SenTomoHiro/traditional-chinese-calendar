export type 界面语言 = "zh-CN" | "en";
export const 语言存储键 = "traditional-calendar-locale";
export function 读取界面语言(存储: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): 界面语言 {
  return 存储?.getItem(语言存储键) === "en" ? "en" : "zh-CN";
}
export function 保存界面语言(语言: 界面语言, 存储: Pick<Storage, "setItem"> | null = typeof localStorage === "undefined" ? null : localStorage): void {
  存储?.setItem(语言存储键, 语言);
}
