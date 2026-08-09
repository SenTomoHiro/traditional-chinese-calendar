#!/bin/zsh
cd -- "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "日历系统当前未运行"
  [[ -z "${LOCAL_TEST_NO_PAUSE:-}" ]] && read -k 1 "?按任意键关闭……"
  exit 0
fi
node "scripts/本地测试控制.mjs" stop
result=$?
[[ -z "${LOCAL_TEST_NO_PAUSE:-}" ]] && read -k 1 "?按任意键关闭……"
exit $result
