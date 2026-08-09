/**
 * 下一阶段的历法模块统一从这里提供结果。
 * 本阶段只保留清晰边界，不提前实现或伪造农历、四柱等算法。
 */
export interface 历法结果 {
  农历: string | null;
  年柱: string | null;
  月柱: string | null;
  日柱: string | null;
  时柱: string | null;
  值星: string | null;
}

export function 获取历法结果占位(): 历法结果 {
  return {
    农历: null,
    年柱: null,
    月柱: null,
    日柱: null,
    时柱: null,
    值星: null,
  };
}
