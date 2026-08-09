export interface 四柱显示输入 {
  年柱: string;
  月柱: string;
  日柱: string;
  时柱: string;
}

export function 格式化四柱({ 年柱, 月柱, 日柱, 时柱 }: 四柱显示输入): string {
  return `${年柱}年　${月柱}月　${日柱}日　${时柱}时`;
}
