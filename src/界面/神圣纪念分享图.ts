import QRCode from "qrcode";
import { 合成完整神像, 读取神像图片 } from "./神像合成";

export const 分享图尺寸 = { 宽: 1080, 主视觉高: 1620 } as const; // 增加主视觉高度，给神像更多空间
export const 分享图二维码地址 = "https://sentomohiro.github.io/traditional-chinese-calendar/";

export interface 分享图内容 {
  神名: string;
  纪念类型: string;
  农历日期: string;
  公历日期: string;
  神像地址: string;
  背景地址: string;
  祥云地址: string;
  段落: Array<{ 标题: string; 正文: string }>;
}

interface 正文行 { y: number; 文本: string; 是标题: boolean }
const 正文左边界 = 100; // 增加左边距
const 正文右边界 = 980; // 减少右边距，增加留白

// 新增：装饰性云纹绘制函数
function 绘制云纹装饰(画笔: CanvasRenderingContext2D, x: number, y: number, 宽: number, 透明度: number = 0.15): void {
  画笔.save();
  画笔.globalAlpha = 透明度;
  画笔.strokeStyle = "#8B2E13";
  画笔.lineWidth = 2;

  // 简化的如意云头纹样
  画笔.beginPath();
  画笔.moveTo(x, y);
  画笔.bezierCurveTo(x + 宽 * 0.2, y - 8, x + 宽 * 0.4, y - 8, x + 宽 * 0.5, y);
  画笔.bezierCurveTo(x + 宽 * 0.6, y + 8, x + 宽 * 0.8, y + 8, x + 宽, y);
  画笔.stroke();

  画笔.restore();
}

// 新增：绘制祥云点缀（围绕神像）
function 绘制祥云点缀(画笔: CanvasRenderingContext2D, 神像区域高: number): void {
  画笔.save();
  画笔.globalAlpha = 0.12;
  画笔.fillStyle = "#FFFFFF";

  // 在神像周围绘制几朵小祥云
  const 云位置 = [
    { x: 120, y: 神像区域高 * 0.3, 尺寸: 80 },
    { x: 880, y: 神像区域高 * 0.35, 尺寸: 70 },
    { x: 150, y: 神像区域高 * 0.7, 尺寸: 60 },
    { x: 860, y: 神像区域高 * 0.75, 尺寸: 65 },
  ];

  for (const { x, y, 尺寸 } of 云位置) {
    画笔.beginPath();
    // 简化的云朵形状（三个圆组合）
    画笔.arc(x, y, 尺寸 * 0.4, 0, Math.PI * 2);
    画笔.arc(x + 尺寸 * 0.5, y, 尺寸 * 0.5, 0, Math.PI * 2);
    画笔.arc(x + 尺寸 * 0.3, y + 尺寸 * 0.3, 尺寸 * 0.35, 0, Math.PI * 2);
    画笔.fill();
  }

  画笔.restore();
}

function 换行(画笔: CanvasRenderingContext2D, 文本: string, 最宽: number): string[] {
  const 行: string[] = [];
  for (const 原行 of 文本.split(/\r?\n/u)) {
    if (!原行) { 行.push(""); continue; }
    let 当前 = "";
    for (const 字 of 原行) {
      if (当前 && 画笔.measureText(当前 + 字).width > 最宽) {
        if (/^[，。、；：！？）】”’]/u.test(字)) {
          行.push(当前 + 字);
          当前 = "";
        } else {
          行.push(当前);
          当前 = 字;
        }
      } else 当前 += 字;
    }
    if (当前) 行.push(当前);
  }
  return 行;
}

/** 保留新版字体与留白，按实际正文长度排版，完整导出所有段落。 */
function 计算正文排版(画笔: CanvasRenderingContext2D, 内容: 分享图内容): { 行: 正文行[]; 高: number } {
  const 行: 正文行[] = [];
  let y = 0;

  // 使用更优雅的字体和行高
  画笔.font = '22px "Songti SC", "STSong", "Noto Serif CJK SC", serif';

  for (const 段 of 内容.段落.filter((项) => 项.正文.trim())) {
    if (行.length) y += 18;

    // 标题更突出
    行.push({ y: y + 28, 文本: 段.标题, 是标题: true });
    y += 46;

    for (const 文本 of 换行(画笔, 段.正文.trim(), 正文右边界 - 正文左边界)) {
      行.push({ y: y + 24, 文本, 是标题: false });
      y += 35;
    }
  }

  return { 行, 高: y };
}

function 绘制正文(画笔: CanvasRenderingContext2D, 排版: ReturnType<typeof 计算正文排版>, 起点: number): void {
  画笔.textAlign = "left";

  for (const 行 of 排版.行) {
    画笔.fillStyle = 行.是标题 ? "#8B2E13" : "#3D2817";
    画笔.font = 行.是标题
      ? '700 26px "STKaiti", "Kaiti SC", "STSong", serif' // 使用楷体作为标题
      : '400 22px "Songti SC", "STSong", "Noto Serif CJK SC", serif';
    画笔.fillText(行.文本, 正文左边界, 起点 + 行.y);
  }
}

/** 优化后的纸面 - 使用渐变营造古籍质感 */
function 绘制一体化纸面(画笔: CanvasRenderingContext2D, 顶部: number, 高: number): void {
  // 基础纸张色 - 更温暖的米色
  const 渐变 = 画笔.createLinearGradient(0, 顶部, 0, 高);
  渐变.addColorStop(0, "#F5EFE6");
  渐变.addColorStop(0.3, "#F0E8D8");
  渐变.addColorStop(1, "#EBE3D1");

  画笔.fillStyle = 渐变;
  画笔.fillRect(0, 顶部, 分享图尺寸.宽, 高 - 顶部);

  // 顶部装饰线 - 模拟画轴边缘
  画笔.strokeStyle = "#8B2E13";
  画笔.lineWidth = 4;
  画笔.beginPath();
  画笔.moveTo(0, 顶部);
  画笔.lineTo(分享图尺寸.宽, 顶部);
  画笔.stroke();

  // 金色细线装饰
  画笔.strokeStyle = "#D4AF37";
  画笔.lineWidth = 2;
  画笔.beginPath();
  画笔.moveTo(0, 顶部 + 6);
  画笔.lineTo(分享图尺寸.宽, 顶部 + 6);
  画笔.stroke();
}

/** 绘制底部匾额样式信息栏 */
function 绘制底部匾额(画笔: CanvasRenderingContext2D, y: number, 农历: string, 公历: string): void {
  const 匾额高 = 100;
  const 匾额左 = 100;
  const 匾额右 = 980;
  const 匾额宽 = 匾额右 - 匾额左;

  // 匾额背景 - 深色木质感
  const 渐变 = 画笔.createLinearGradient(匾额左, y, 匾额左, y + 匾额高);
  渐变.addColorStop(0, "#5D3026");
  渐变.addColorStop(0.5, "#4A231B");
  渐变.addColorStop(1, "#5D3026");

  画笔.fillStyle = 渐变;
  画笔.fillRect(匾额左, y, 匾额宽, 匾额高);

  // 匾额边框
  画笔.strokeStyle = "#D4AF37";
  画笔.lineWidth = 3;
  画笔.strokeRect(匾额左, y, 匾额宽, 匾额高);

  // 内边框
  画笔.strokeStyle = "#D4AF37";
  画笔.lineWidth = 1.5;
  画笔.strokeRect(匾额左 + 8, y + 8, 匾额宽 - 16, 匾额高 - 16);

  // 日期文字 - 金色
  画笔.textAlign = "center";
  画笔.fillStyle = "#F5E6C8";
  画笔.font = '600 24px "STKaiti", "Kaiti SC", serif';
  画笔.fillText(`${农历}  ·  ${公历}`, 匾额左 + 匾额宽 / 2, y + 匾额高 / 2 + 8);
}

export async function 生成神圣纪念分享图(内容: 分享图内容): Promise<HTMLCanvasElement> {
  const 画布 = document.createElement("canvas");
  const 画笔 = 画布.getContext("2d");
  if (!画笔) throw new Error("浏览器无法创建分享图画布");

  // 计算布局
  const 正文 = 计算正文排版(画笔, 内容);
  const 主视觉高 = 分享图尺寸.主视觉高;
  const 标题区高 = 150; // 标题区域
  const 正文起点 = 主视觉高 + 标题区高 + 40;
  const 匾额区起点 = 正文起点 + 正文.高 + 60;
  const 页脚起点 = 匾额区起点 + 140;
  const 高 = 页脚起点 + 90;

  画布.width = 分享图尺寸.宽;
  画布.height = 高;

  // 1. 绘制神像主视觉区域
  if (内容.神像地址) {
    const 神像 = await 合成完整神像(内容.神像地址, 内容.背景地址, 内容.祥云地址, {
      宽: 分享图尺寸.宽,
      高: 主视觉高,
      主体区域: { x: 90, y: 100, 宽: 900, 高: 主视觉高 - 200 }, // 神像更大更居中
      祥云区域: { x: 0, y: 0, 宽: 分享图尺寸.宽, 高: 主视觉高 },
    });
    画笔.drawImage(神像, 0, 0);

    // 在神像周围添加祥云点缀
    绘制祥云点缀(画笔, 主视觉高);
  } else {
    const 背景 = await 读取神像图片(内容.背景地址);
    const 缩放 = Math.max(分享图尺寸.宽 / 背景.naturalWidth, 主视觉高 / 背景.naturalHeight);
    const 宽 = 背景.naturalWidth * 缩放;
    画笔.drawImage(背景, (分享图尺寸.宽 - 宽) / 2, 0, 宽, 背景.naturalHeight * 缩放);
  }

  // 2. 绘制纸面区域
  绘制一体化纸面(画笔, 主视觉高, 高);

  // 3. 绘制顶部标题区（在纸面上）
  const 标题y = 主视觉高 + 40;

  // 纪念类型（小标）
  画笔.textAlign = "center";
  画笔.fillStyle = "#A67C52";
  画笔.font = '500 28px "STKaiti", "Kaiti SC", serif';
  画笔.fillText(内容.纪念类型, 540, 标题y + 35);

  // 云纹装饰在纪念类型两侧
  绘制云纹装饰(画笔, 200, 标题y + 28, 120, 0.18);
  绘制云纹装饰(画笔, 760, 标题y + 28, 120, 0.18);

  // 神名（大标题）
  画笔.fillStyle = "#70251E";
  画笔.font = '700 68px "STSong", "Songti SC", serif';
  画笔.fillText(内容.神名, 540, 标题y + 115);

  // 4. 绘制正文内容
  绘制正文(画笔, 正文, 正文起点);

  // 5. 绘制底部匾额样式日期栏
  绘制底部匾额(画笔, 匾额区起点, 内容.农历日期, 内容.公历日期);

  // 6. 绘制页脚
  const 页脚y = 页脚起点;

  // 分隔线
  画笔.strokeStyle = "rgba(139, 46, 19, 0.25)";
  画笔.lineWidth = 1;
  画笔.beginPath();
  画笔.moveTo(正文左边界, 页脚y);
  画笔.lineTo(正文右边界, 页脚y);
  画笔.stroke();

  // 左侧装饰竖线
  画笔.fillStyle = "#D4AF37";
  画笔.fillRect(正文左边界, 页脚y + 28, 4, 38);

  // 网站名称
  画笔.textAlign = "left";
  画笔.fillStyle = "#70251E";
  画笔.font = '600 26px "STKaiti", "Kaiti SC", serif';
  画笔.fillText("传统历法日历系统", 正文左边界 + 20, 页脚y + 54);

  // 二维码区域
  const 二维码尺寸 = 70; // 从80缩小到70，避免截断
  const 二维码x = 正文右边界 - 二维码尺寸 - 10; // 增加右边距
  const 二维码y = 页脚y + 20;

  // 二维码提示文字
  画笔.textAlign = "right";
  画笔.fillStyle = "#8B6F47";
  画笔.font = '400 18px "Songti SC", serif';
  画笔.fillText("扫码查看", 二维码x - 16, 页脚y + 54);

  // 生成并绘制二维码
  const 二维码数据 = await QRCode.toDataURL(分享图二维码地址, {
    margin: 1,
    width: 二维码尺寸 * 3,
    color: { dark: "#5D3026", light: "#F5EFE6" },
  });
  const 二维码图片 = await 读取神像图片(二维码数据);

  // 二维码边框装饰
  画笔.strokeStyle = "#D4AF37";
  画笔.lineWidth = 2;
  画笔.strokeRect(二维码x - 4, 二维码y - 4, 二维码尺寸 + 8, 二维码尺寸 + 8);

  画笔.drawImage(二维码图片, 二维码x, 二维码y, 二维码尺寸, 二维码尺寸);

  return 画布;
}
