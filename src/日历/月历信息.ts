import { 创建北京时间 } from "../历法/时间";
import { 获取传统节日, 转换为农历, type 农历日期 } from "../历法/农历";
import { 获取神圣纪念日 } from "../规则/神圣纪念日";
import type { 配置解析结果 } from "../规则/配置读取";
import { 获取某月天数 } from "./公历";

export interface 月历日期信息 {
  公历日: number;
  农历: 农历日期;
  农历摘要: string;
  传统节日: string[];
  神圣纪念: string[];
  事件摘要: string | null;
  其余事件数: number;
}

export function 格式化农历摘要(农历: 农历日期): string {
  return 农历.日 === 1 ? 农历.月名 : 农历.日名;
}

export function 创建月历日期信息(
  年: number,
  月: number,
  神圣纪念配置?: 配置解析结果,
): 月历日期信息[] {
  return Array.from({ length: 获取某月天数(年, 月) }, (_, 索引) => {
    const 公历日 = 索引 + 1;
    const 时间 = 创建北京时间(年, 月 + 1, 公历日);
    const 农历 = 转换为农历(时间);
    const 传统节日 = 获取传统节日(时间);
    const 神圣纪念 = 获取神圣纪念日(神圣纪念配置, 农历);
    const 全部事件 = [...传统节日, ...神圣纪念];
    return {
      公历日,
      农历,
      农历摘要: 格式化农历摘要(农历),
      传统节日,
      神圣纪念,
      事件摘要: 全部事件[0] ?? null,
      其余事件数: Math.max(0, 全部事件.length - 1),
    };
  });
}
