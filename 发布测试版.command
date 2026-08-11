#!/bin/zsh

cd "${0:A:h}"
./scripts/deploy-github-pages.sh
RESULT=$?

if [[ -t 0 ]]; then
  print
  if (( RESULT == 0 )); then
    print "发布操作已完成。按任意键关闭窗口。"
  else
    print "发布没有完成，请保留窗口内容。按任意键关闭窗口。"
  fi
  read -k 1
fi

exit "$RESULT"
