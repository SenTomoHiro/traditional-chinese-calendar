/**
 * 界面交互增强
 * 为CSS动画提供JavaScript支持
 */

// ============================================
// 1. 弹窗关闭动画
// ============================================

/**
 * 优雅地关闭神仙圣诞弹窗，带退出动画
 */
export function 关闭神仙弹窗(弹窗元素: HTMLDialogElement): void {
  if (!弹窗元素.open || 弹窗元素.classList.contains('is-closing')) return;
  弹窗元素.classList.add('is-closing');
  const 完成关闭 = () => {
    弹窗元素.classList.remove('is-closing');
    if (弹窗元素.open) 弹窗元素.close();
  };
  const 退出动画 = 弹窗元素.getAnimations().find((动画) =>
    (动画 as CSSAnimation).animationName === 'dialog-scale-out',
  );
  // 直接使用实际动画的完成/取消生命周期；无动画时立即关闭。
  if (退出动画) void 退出动画.finished.then(完成关闭, 完成关闭);
  else 完成关闭();
}

/** 接入原生 Escape 关闭；按钮和背景点击由 main.ts 的正式事件处理。 */
export function 初始化弹窗关闭(根节点: HTMLElement): () => void {
  const 处理取消 = (事件: Event) => {
    const 弹窗 = 事件.target;
    if (!(弹窗 instanceof HTMLDialogElement) || !弹窗.matches('.deity-dialog')) return;
    事件.preventDefault();
    关闭神仙弹窗(弹窗);
  };
  根节点.addEventListener('cancel', 处理取消, true);
  return () => 根节点.removeEventListener('cancel', 处理取消, true);
}

// ============================================
// 2. 日历日期涟漪效果
// ============================================

interface 涟漪配置 {
  颜色?: string;
  持续时间?: number;
}

/**
 * 在日期按钮上创建点击涟漪效果
 */
export function 创建涟漪(
  按钮: HTMLElement,
  事件: MouseEvent | TouchEvent,
  配置: 涟漪配置 = {}
): void {
  const { 颜色 = 'rgba(212, 175, 55, 0.4)', 持续时间 = 600 } = 配置;

  // 创建涟漪元素
  const 涟漪 = document.createElement('span');
  涟漪.classList.add('ripple');

  // 计算点击位置
  const 按钮位置 = 按钮.getBoundingClientRect();
  let x: number, y: number;

  if (事件 instanceof MouseEvent) {
    x = 事件.clientX - 按钮位置.left;
    y = 事件.clientY - 按钮位置.top;
  } else {
    // TouchEvent
    const 触摸 = 事件.touches[0] || 事件.changedTouches[0];
    x = 触摸.clientX - 按钮位置.left;
    y = 触摸.clientY - 按钮位置.top;
  }

  // 计算涟漪大小（覆盖整个按钮）
  const 尺寸 = Math.max(按钮位置.width, 按钮位置.height) * 2;

  // 设置样式
  涟漪.style.width = `${尺寸}px`;
  涟漪.style.height = `${尺寸}px`;
  涟漪.style.left = `${x - 尺寸 / 2}px`;
  涟漪.style.top = `${y - 尺寸 / 2}px`;
  涟漪.style.background = 颜色;

  按钮.appendChild(涟漪);

  // 动画结束后移除
  setTimeout(() => {
    涟漪.remove();
  }, 持续时间);
}

/**
 * 初始化日历日期按钮的涟漪效果
 * 使用事件委托绑定到父容器，避免动态渲染后失效
 */
export function 初始化日期涟漪(根节点: HTMLElement): () => void {
  const 处理点击 = (事件: Event) => {
    if (!(事件.target instanceof Element) || !(事件 instanceof MouseEvent)) return;
    const 点击按钮 = 事件.target.closest<HTMLElement>('.day-button');
    const 日期 = 点击按钮?.dataset.date;
    if (!日期) return;
    // main.ts 先处理日期切换并重绘；在仍然存在的根节点上找到新按钮。
    const 按钮 = 根节点.querySelector<HTMLElement>(`.day-button[data-date="${日期}"]`);
    if (按钮) 创建涟漪(按钮, 事件);
  };
  根节点.addEventListener('click', 处理点击);
  return () => 根节点.removeEventListener('click', 处理点击);
}

// ============================================
// 3. 神仙圣诞日期标记
// ============================================

export interface 神仙纪念 {
  日期: string; // 格式：YYYY-MM-DD
  神名: string;
}

/**
 * 为神仙圣诞日期添加特殊样式
 */
export function 标记神仙圣诞日期(神仙列表: 神仙纪念[]): void {
  神仙列表.forEach(({ 日期 }) => {
    const 日期按钮 = document.querySelector<HTMLButtonElement>(
      `.day-button[data-date="${日期}"]`
    );
    if (日期按钮 && !日期按钮.classList.contains('has-deity')) {
      日期按钮.classList.add('has-deity');
    }
  });
}

/**
 * 清除所有神仙圣诞标记
 */
export function 清除神仙标记(): void {
  document.querySelectorAll('.day-button.has-deity').forEach(按钮 => {
    按钮.classList.remove('has-deity');
  });
}

// ============================================
// 4. 八字分析动画触发
// ============================================

/**
 * 触发八字四柱的淡入动画
 */
export function 触发八字动画(图表元素: HTMLElement): void {
  // 移除旧的动画类（如果有）
  图表元素.classList.remove('is-animating');

  // 强制浏览器重排，重置动画
  void 图表元素.offsetWidth;

  // 重新添加动画类
  图表元素.classList.add('is-animating');
}

/**
 * 使用 Intersection Observer 自动触发八字动画
 */
export function 初始化八字自动动画(根节点: HTMLElement): { 刷新: () => void; 清理: () => void } {
  if (typeof window.IntersectionObserver !== 'function') return { 刷新: () => {}, 清理: () => {} };
  const 观察器配置: IntersectionObserverInit = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1, // 10% 可见时触发
  };

  const 观察器 = new IntersectionObserver((条目列表) => {
    条目列表.forEach(条目 => {
      if (条目.isIntersecting && !条目.target.classList.contains('is-animating')) {
        触发八字动画(条目.target as HTMLElement);
        观察器.unobserve(条目.target); // 只触发一次
      }
    });
  }, 观察器配置);

  return {
    刷新: () => {
      观察器.disconnect();
      根节点.querySelectorAll('.bazi-chart:not(.is-animating)').forEach(图表 => 观察器.observe(图表));
    },
    清理: () => 观察器.disconnect(),
  };
}

// ============================================
// 5. 时辰卡片交互增强
// ============================================

/**
 * 高亮当前时辰
 */
export function 高亮当前时辰(根节点: HTMLElement): void {
  // 当前时辰由正式历时渲染与现有分钟更新器计算，增强层只同步视觉状态。
  根节点.querySelectorAll('.hour-card').forEach(卡片 => {
    卡片.classList.toggle('is-current', !!卡片.querySelector('.hour-segment.is-current'));
  });
}

// ============================================
// 6. 择日结果卡片动画
// ============================================

/**
 * 为新生成的择日结果添加渐入动画
 */
export function 动画显示择日结果(结果容器: HTMLElement): void {
  if (是否偏好减少动画()) return;
  const 结果卡片列表 = 结果容器.querySelectorAll<HTMLElement>('.election-day');

  结果卡片列表.forEach((卡片, 索引) => {
    // 隐藏状态仅存在于动画关键帧；动画未执行时卡片仍可正常阅读。
    卡片.animate([
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 400, delay: 索引 * 80, easing: 'ease', fill: 'backwards' });
  });
}

// ============================================
// 7. 性能优化：减少动画开销
// ============================================

/**
 * 检测用户是否偏好减少动画
 */
export function 是否偏好减少动画(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 根据用户偏好条件性地执行动画
 */
export function 条件动画<T extends (...args: any[]) => any>(
  动画函数: T,
  参数: Parameters<T>
): ReturnType<T> | undefined {
  if (!是否偏好减少动画()) {
    return 动画函数(...参数);
  }
  return undefined;
}

// ============================================
// 8. 统一初始化函数
// ============================================

/**
 * 初始化所有交互增强功能
 */
export function 初始化界面增强(根节点: HTMLElement) {
  const 清理弹窗 = 初始化弹窗关闭(根节点);
  const 清理涟漪 = 初始化日期涟漪(根节点);
  const 八字动画 = 初始化八字自动动画(根节点);
  const 刷新 = () => {
    八字动画.刷新();
    高亮当前时辰(根节点);
  };
  刷新();

  return {
    刷新,
    清理: () => {
      清理弹窗();
      清理涟漪();
      八字动画.清理();
    },
  };
}

// ============================================
// 9. 工具函数导出
// ============================================

export default {
  初始化界面增强,
  关闭神仙弹窗,
  创建涟漪,
  标记神仙圣诞日期,
  清除神仙标记,
  触发八字动画,
  高亮当前时辰,
  动画显示择日结果,
  是否偏好减少动画,
  条件动画,
};
