export interface 神像合成布局 {
  宽: number;
  高: number;
  主体区域: { x: number; y: number; 宽: number; 高: number };
  祥云区域: { x: number; y: number; 宽: number; 高: number };
}

export async function 读取神像图片(地址: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const 图片 = new Image();
    图片.onload = () => resolve(图片);
    图片.onerror = () => reject(new Error(`神像素材加载失败：${地址}`));
    图片.src = 地址;
  });
}

function 绘制覆盖(画笔: CanvasRenderingContext2D, 图片: HTMLImageElement, x: number, y: number, 宽: number, 高: number): void {
  const 比例 = Math.max(宽 / 图片.naturalWidth, 高 / 图片.naturalHeight);
  const 绘制宽 = 图片.naturalWidth * 比例;
  const 绘制高 = 图片.naturalHeight * 比例;
  画笔.drawImage(图片, x + (宽 - 绘制宽) / 2, y + (高 - 绘制高) / 2, 绘制宽, 绘制高);
}

function 绘制适应(画笔: CanvasRenderingContext2D, 图片: HTMLImageElement, x: number, y: number, 宽: number, 高: number): void {
  const 比例 = Math.min(宽 / 图片.naturalWidth, 高 / 图片.naturalHeight);
  const 绘制宽 = 图片.naturalWidth * 比例;
  const 绘制高 = 图片.naturalHeight * 比例;
  画笔.drawImage(图片, x + (宽 - 绘制宽) / 2, y + (高 - 绘制高) / 2, 绘制宽, 绘制高);
}

/** 正式神像三层：通用背景铺满、主体完整适应、祥云前景覆盖。 */
export async function 合成完整神像(主体地址: string, 背景地址: string, 祥云地址: string, 布局: 神像合成布局): Promise<HTMLCanvasElement> {
  const [背景, 主体, 祥云] = await Promise.all([读取神像图片(背景地址), 读取神像图片(主体地址), 读取神像图片(祥云地址)]);
  const 画布 = document.createElement("canvas");
  画布.width = 布局.宽;
  画布.height = 布局.高;
  const 画笔 = 画布.getContext("2d");
  if (!画笔) throw new Error("浏览器无法创建神像画布");
  绘制覆盖(画笔, 背景, 0, 0, 布局.宽, 布局.高);
  const 主体区域 = 布局.主体区域;
  绘制适应(画笔, 主体, 主体区域.x, 主体区域.y, 主体区域.宽, 主体区域.高);
  const 祥云区域 = 布局.祥云区域;
  绘制覆盖(画笔, 祥云, 祥云区域.x, 祥云区域.y, 祥云区域.宽, 祥云区域.高);
  return 画布;
}
