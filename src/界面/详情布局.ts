export interface 日期事件栏 {
  标题: "神圣纪念" | "传统节日";
  事件: string[];
}

/** 有任一类事件时固定返回两栏，避免空栏导致布局结构变化。 */
export function 创建日期事件分栏(神圣纪念: string[], 传统节日: string[]): 日期事件栏[] {
  if (神圣纪念.length === 0 && 传统节日.length === 0) return [];
  return [
    { 标题: "神圣纪念", 事件: 神圣纪念 },
    { 标题: "传统节日", 事件: 传统节日 },
  ];
}
