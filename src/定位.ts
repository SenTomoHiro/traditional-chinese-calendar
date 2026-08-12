export type 定位失败原因 = "不支持" | "非安全连接" | "已拒绝" | "不可用" | "超时" | "坐标无效" | "未知错误";

export type 定位结果 =
  | { 成功: true; 经度: number; 纬度: number; 精度米: number }
  | { 成功: false; 原因: 定位失败原因 };

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
}

export interface 浏览器定位接口 {
  getCurrentPosition(
    成功: (位置: 定位位置) => void,
    失败?: (错误: 定位错误) => void,
    选项?: PositionOptions,
  ): void;
}

function 默认定位接口(): 浏览器定位接口 | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.geolocation;
}

function 是安全定位环境(): boolean {
  return typeof window === "undefined" || window.isSecureContext;
}

function 转换失败原因(代码: number): 定位失败原因 {
  if (代码 === 1) return "已拒绝";
  if (代码 === 2) return "不可用";
  if (代码 === 3) return "超时";
  return "未知错误";
}

/** 仅取一次浏览器坐标并保存在内存中，不上传、不持久化。 */
export function 获取浏览器定位(
  定位接口: 浏览器定位接口 | undefined = 默认定位接口(),
  安全定位环境 = 是安全定位环境(),
): Promise<定位结果> {
  if (!安全定位环境) return Promise.resolve({ 成功: false, 原因: "非安全连接" });
  if (!定位接口) return Promise.resolve({ 成功: false, 原因: "不支持" });

  return new Promise((完成) => {
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
            完成({ 成功: false, 原因: "坐标无效" });
            return;
          }
          完成({
            成功: true,
            经度: coords.longitude,
            纬度: coords.latitude,
            精度米: Number.isFinite(coords.accuracy) ? coords.accuracy : 0,
          });
        },
        (错误) => 完成({ 成功: false, 原因: 转换失败原因(错误.code) }),
        { enableHighAccuracy: false, timeout: 15_000, maximumAge: 0 },
      );
    } catch {
      完成({ 成功: false, 原因: "未知错误" });
    }
  });
}

export function 定位失败提示(原因: 定位失败原因): string {
  switch (原因) {
    case "已拒绝":
      return "定位权限未允许，请在Safari网站设置中允许定位。";
    case "不可用":
      return "暂时无法取得位置，请稍后重试。";
    case "超时":
      return "定位超时，请重新获取。";
    case "不支持":
      return "当前浏览器不支持定位。";
    case "非安全连接":
      return "当前页面不是安全连接，无法使用定位。";
    default:
      return "暂时无法取得位置，请重新获取。";
  }
}
