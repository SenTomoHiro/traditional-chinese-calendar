#!/bin/zsh
cd -- "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js，再重新双击本文件。"
  [[ -z "${LOCAL_TEST_NO_PAUSE:-}" ]] && read -k 1 "?按任意键关闭……"
  exit 1
fi
node "scripts/本地测试控制.mjs" restart
result=$?
[[ -z "${LOCAL_TEST_NO_PAUSE:-}" ]] && read -k 1 "?按任意键关闭……"
exit $result
