export type 定位失败原因 = "不支持" | "非安全连接" | "已拒绝" | "不可用" | "超时" | "坐标无效" | "未知错误";

export type 定位错误码 = 1 | 2 | 3 | null;

export type 定位结果 =
  | { 成功: true; 经度: number; 纬度: number; 精度米: number; 尝试次数: number }
  | { 成功: false; 原因: 定位失败原因; 错误码: 定位错误码; 尝试次数: number };

interface 定位坐标 {
  longitude: number;
  latitude: number;
  accuracy: number;
}

interface 定位位置 {
  coords: 定位坐标;
}

interface 定位错误 {
  code: number;
  message?: string;
}

export interface 浏览器定位接口 {
  getCurrentPosition(
    成功: (位置: 定位位置) => void,
    失败?: (错误: 定位错误) => void,
    选项?: PositionOptions,
  ): void;
}

export interface 定位环境诊断 {
  HTTPS: boolean;
  支持定位: boolean;
  页面可见: boolean;
}

const 首次定位选项: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 300_000,
};

const 降级重试选项: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15_000,
  maximumAge: 0,
};

function 默认定位接口(): 浏览器定位接口 | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.geolocation;
}

function 是安全定位环境(): boolean {
  return typeof window === "undefined" || window.isSecureContext;
}

function 标准错误码(代码: number): 定位错误码 {
  return 代码 === 1 || 代码 === 2 || 代码 === 3 ? 代码 : null;
}

function 转换失败原因(代码: number): 定位失败原因 {
  if (代码 === 1) return "已拒绝";
  if (代码 === 2) return "不可用";
  if (代码 === 3) return "超时";
  return "未知错误";
}

function 记录定位错误(错误: 定位错误, 尝试次数: number): void {
  if (import.meta.env.MODE === "test" || typeof console === "undefined") return;
  console.warn("[定位诊断] GeolocationPositionError", {
    code: 错误.code,
    message: 错误.message ?? "",
    attempt: 尝试次数,
  });
}

export function 读取定位环境(): 定位环境诊断 {
  const 有窗口 = typeof window !== "undefined";
  const 有导航器 = typeof navigator !== "undefined";
  return {
    HTTPS: !有窗口 || (window.isSecureContext && window.location.protocol === "https:"),
    支持定位: 有导航器 && Boolean(navigator.geolocation),
    页面可见: typeof document === "undefined" || document.visibilityState === "visible",
  };
}

/** 仅在浏览器本地取坐标；不可用或超时时自动降级重试一次，不上传、不持久化。 */
export function 获取浏览器定位(
  定位接口: 浏览器定位接口 | undefined = 默认定位接口(),
  安全定位环境 = 是安全定位环境(),
): Promise<定位结果> {
  if (!安全定位环境) return Promise.resolve({ 成功: false, 原因: "非安全连接", 错误码: null, 尝试次数: 0 });
  if (!定位接口) return Promise.resolve({ 成功: false, 原因: "不支持", 错误码: null, 尝试次数: 0 });

  return new Promise((完成) => {
    let 已完成 = false;

    const 完成一次 = (结果: 定位结果): void => {
      if (已完成) return;
      已完成 = true;
      完成(结果);
    };

    const 请求一次 = (尝试次数: 1 | 2, 选项: PositionOptions): void => {
      try {
        定位接口.getCurrentPosition(
          ({ coords }) => {
            if (
              !Number.isFinite(coords.longitude) ||
              coords.longitude < -180 ||
              coords.longitude > 180 ||
              !Number.isFinite(coords.latitude) ||
              coords.latitude < -90 ||
              coords.latitude > 90
            ) {
              完成一次({ 成功: false, 原因: "坐标无效", 错误码: null, 尝试次数 });
              return;
            }
            完成一次({
              成功: true,
              经度: coords.longitude,
              纬度: coords.latitude,
              精度米: Number.isFinite(coords.accuracy) ? coords.accuracy : 0,
              尝试次数,
            });
          },
          (错误) => {
            记录定位错误(错误, 尝试次数);
            if (尝试次数 === 1 && (错误.code === 2 || 错误.code === 3)) {
              请求一次(2, 降级重试选项);
              return;
            }
            完成一次({
              成功: false,
              原因: 转换失败原因(错误.code),
              错误码: 标准错误码(错误.code),
              尝试次数,
            });
          },
          选项,
        );
      } catch {
        完成一次({ 成功: false, 原因: "未知错误", 错误码: null, 尝试次数 });
      }
    };

    // 此调用在点击事件的同步调用栈中执行，不经过 Permissions API、渲染或定时器。
    请求一次(1, 首次定位选项);
  });
}

export function 定位失败提示(原因: 定位失败原因): string {
  switch (原因) {
    case "已拒绝":
      return "Safari未允许定位。请检查iPhone 设置 → 隐私与安全性 → 定位服务，以及当前网站的位置权限。";
    case "不可用":
      return "Safari暂时无法取得位置，已自动重试；请保持页面可见后重新获取。";
    case "超时":
      return "定位超时，已自动重试；请保持页面可见后重新获取。";
    case "不支持":
      return "当前浏览器不支持定位。";
    case "非安全连接":
      return "当前页面不是安全连接，无法使用定位。";
    default:
      return "暂时无法取得位置，请重新获取。";
  }
}
