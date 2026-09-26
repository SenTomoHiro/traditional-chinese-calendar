import QRCode from "qrcode";
import { 合成完整神像, 读取神像图片 } from "./神像合成";

export const 分享图尺寸 = { 宽: 1080, 高: 1350 } as const;
export const 分享图二维码地址 = "https://sentomohiro.github.io/0f25bcf2bbb8a869e712/";

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
const 正文左边界 = 80;
const 正文右边界 = 1000;

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

/** 正文只按实际存在的段落顺序向下排，不预留空栏或空章节。 */
function 计算正文排版(画笔: CanvasRenderingContext2D, 内容: 分享图内容): { 行: 正文行[]; 高: number } {
  const 行: 正文行[] = [];
  let y = 0;
  画笔.font = '20px "Songti SC", "STSong", "Noto Serif CJK SC", serif';
  for (const 段 of 内容.段落.filter((项) => 项.正文.trim())) {
    if (行.length) y += 12;
    行.push({ y: y + 25, 文本: 段.标题, 是标题: true });
    y += 39;
    for (const 文本 of 换行(画笔, 段.正文.trim(), 920)) {
      行.push({ y: y + 21, 文本, 是标题: false });
      y += 30;
    }
  }
  return { 行, 高: y };
}

function 绘制正文(画笔: CanvasRenderingContext2D, 排版: ReturnType<typeof 计算正文排版>, 起点: number): void {
  画笔.textAlign = "left";
  for (const 行 of 排版.行) {
    画笔.fillStyle = 行.是标题 ? "#8f3528" : "#3d2d22";
    画笔.font = 行.是标题
      ? '600 24px "Songti SC", "STSong", serif'
      : '20px "Songti SC", "STSong", "Noto Serif CJK SC", serif';
    画笔.fillText(行.文本, 正文左边界, 起点 + 行.y);
  }
}

/** 根据神像原始长宽收拢视觉版心；窄幅像形成近 3:4 竖向主视觉，宽幅像仍完整容纳。 */
function 绘制主视觉聚焦(画笔: CanvasRenderingContext2D, 底部: number, 焦点宽: number): void {
  const 侧缘 = (1080 - 焦点宽) / 2;
  const 渐变宽 = 侧缘 + 30;
  const 左侧 = 画笔.createLinearGradient(0, 0, 渐变宽, 0);
  左侧.addColorStop(0, "rgba(112, 37, 30, 0.28)");
  左侧.addColorStop(1, "rgba(112, 37, 30, 0)");
  画笔.fillStyle = 左侧;
  画笔.fillRect(0, 0, 渐变宽, 底部);
  const 右侧 = 画笔.createLinearGradient(1080 - 渐变宽, 0, 1080, 0);
  右侧.addColorStop(0, "rgba(112, 37, 30, 0)");
  右侧.addColorStop(1, "rgba(112, 37, 30, 0.28)");
  画笔.fillStyle = 右侧;
  画笔.fillRect(1080 - 渐变宽, 0, 渐变宽, 底部);
  画笔.strokeStyle = "rgba(170, 120, 44, 0.43)";
  画笔.lineWidth = 1.5;
  for (const x of [侧缘, 1080 - 侧缘]) {
    画笔.beginPath();
    画笔.moveTo(x, 86);
    画笔.lineTo(x, 底部 - 48);
    画笔.stroke();
    画笔.fillStyle = "#aa782c";
    画笔.beginPath();
    画笔.arc(x, 86, 3, 0, Math.PI * 2);
    画笔.fill();
  }
}

/** 一层从标题延续到页脚的浅色宣纸底，保留原背景纹理且没有拼接缝。 */
function 绘制一体化纸面(画笔: CanvasRenderingContext2D, 顶部: number, 高: number): void {
  const 渐变 = 画笔.createLinearGradient(0, 顶部, 0, 顶部 + 260);
  渐变.addColorStop(0, "rgba(255, 243, 224, 0.76)");
  渐变.addColorStop(0.55, "rgba(255, 246, 232, 0.92)");
  渐变.addColorStop(1, "rgba(255, 247, 234, 0.97)");
  画笔.beginPath();
  画笔.moveTo(0, 顶部 + 18);
  画笔.quadraticCurveTo(540, 顶部 - 22, 1080, 顶部 + 18);
  画笔.lineTo(1080, 高);
  画笔.lineTo(0, 高);
  画笔.closePath();
  画笔.fillStyle = 渐变;
  画笔.fill();
  画笔.beginPath();
  画笔.moveTo(0, 顶部 + 18);
  画笔.quadraticCurveTo(540, 顶部 - 22, 1080, 顶部 + 18);
  画笔.strokeStyle = "rgba(147, 54, 44, 0.61)";
  画笔.lineWidth = 2;
  画笔.stroke();
}

export async function 生成神圣纪念分享图(内容: 分享图内容): Promise<HTMLCanvasElement> {
  const 画布 = document.createElement("canvas");
  const 画笔 = 画布.getContext("2d");
  if (!画笔) throw new Error("浏览器无法创建分享图画布");
  const 正文 = 计算正文排版(画笔, 内容);
  const 所需顶部 = 分享图尺寸.高 - 正文.高 - 300;
  const 纸面顶部 = 内容.神像地址
    ? Math.min(正文.高 === 0 ? 1050 : 960, Math.max(810, 所需顶部))
    : Math.min(650, Math.max(530, 所需顶部));
  const 高 = Math.max(分享图尺寸.高, Math.ceil(纸面顶部 + 正文.高 + 300));
  画布.width = 分享图尺寸.宽;
  画布.height = 高;

  let 焦点宽 = 720;
  if (内容.神像地址) {
    const [主体图片, 神像] = await Promise.all([
      读取神像图片(内容.神像地址),
      合成完整神像(内容.神像地址, 内容.背景地址, 内容.祥云地址, {
        宽: 1080, 高,
        主体区域: { x: 80, y: 16, 宽: 920, 高: 820 },
        祥云区域: { x: 0, y: 0, 宽: 1080, 高 },
      }),
    ]);
    const 主体显示宽 = Math.min(920, 820 * 主体图片.naturalWidth / 主体图片.naturalHeight);
    焦点宽 = Math.min(960, Math.max(520, 主体显示宽 + 80));
    画笔.drawImage(神像, 0, 0);
  } else {
    const 背景 = await 读取神像图片(内容.背景地址);
    画笔.drawImage(背景, 0, 0, 1080, 高);
  }

  if (内容.神像地址) 绘制主视觉聚焦(画笔, 纸面顶部 + 18, 焦点宽);
  绘制一体化纸面(画笔, 纸面顶部, 高);
  画笔.textAlign = "center";
  画笔.fillStyle = "#a7782c";
  画笔.font = '600 26px "Songti SC", "STSong", serif';
  画笔.fillText(内容.纪念类型, 540, 纸面顶部 + 51, 900);
  画笔.fillStyle = "#70251e";
  画笔.font = '600 45px "Songti SC", "STSong", serif';
  画笔.fillText(内容.神名, 540, 纸面顶部 + 106, 900);
  画笔.font = '22px "Songti SC", "STSong", serif';
  画笔.fillStyle = "#704713";
  画笔.fillText(`${内容.农历日期}  ·  ${内容.公历日期}`, 540, 纸面顶部 + 144, 900);
  绘制正文(画笔, 正文, 纸面顶部 + 176);

  const 页脚顶部 = 高 - 108;
  画笔.strokeStyle = "rgba(147, 54, 44, 0.31)";
  画笔.lineWidth = 1;
  画笔.beginPath();
  画笔.moveTo(正文左边界, 页脚顶部);
  画笔.lineTo(正文右边界, 页脚顶部);
  画笔.stroke();
  画笔.fillStyle = "#aa782c";
  画笔.fillRect(正文左边界, 高 - 76, 4, 33);
  画笔.fillStyle = "#70251e";
  画笔.font = '600 25px "Songti SC", "STSong", serif';
  画笔.fillText("传统历法日历系统", 正文左边界 + 21, 高 - 50);
  画笔.textAlign = "right";
  画笔.fillStyle = "#704713";
  画笔.font = '18px "Songti SC", "STSong", serif';
  画笔.fillText("扫码查看日历", 896, 高 - 50);
  const 二维码 = await QRCode.toDataURL(分享图二维码地址, { margin: 0, width: 120, color: { dark: "#5d3026", light: "#fff8eb" } });
  const 二维码图片 = await 读取神像图片(二维码);
  画笔.drawImage(二维码图片, 正文右边界 - 88, 高 - 104, 88, 88);
  return 画布;
}
