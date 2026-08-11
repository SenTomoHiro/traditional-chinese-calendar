#!/bin/zsh

set -euo pipefail

SCRIPT_DIR=${0:A:h}
PROJECT_ROOT=${SCRIPT_DIR:h}

source "$SCRIPT_DIR/pages-deploy.config"

if ! print -r -- "$PAGES_REPOSITORY" | grep -Eq '^[a-z0-9]{16,24}$'; then
  print -u2 "发布仓库名格式不正确。"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  print -u2 "尚未安装 GitHub 发布工具。"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  print -u2 "GitHub 登录已失效，请重新授权后再发布。"
  exit 1
fi

cd "$PROJECT_ROOT"

print "正在检查网站……"
npm test

print "正在生成测试版……"
PAGES_REPOSITORY="$PAGES_REPOSITORY" npm run build

[[ -f dist/index.html ]] || { print -u2 "生成失败：缺少网站首页。"; exit 1; }
[[ -f dist/robots.txt ]] || { print -u2 "生成失败：缺少禁止收录文件。"; exit 1; }
[[ -f dist/.nojekyll ]] || { print -u2 "生成失败：缺少 Pages 标记文件。"; exit 1; }

if find dist -type f \( -name '.env*' -o -name '*.pem' -o -name '*.key' \) | grep -q .; then
  print -u2 "安全检查失败：构建产物中包含不应公开的文件。"
  exit 1
fi

if grep -RIEq '/Users/|github_pat_|gh[opsu]_[A-Za-z0-9_]+|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY' dist; then
  print -u2 "安全检查失败：构建产物中疑似包含本机路径或凭据。"
  exit 1
fi

FULL_REPOSITORY="$PAGES_OWNER/$PAGES_REPOSITORY"

if ! gh repo view "$FULL_REPOSITORY" >/dev/null 2>&1; then
  print "正在创建公开测试仓库……"
  gh repo create "$FULL_REPOSITORY" --public --disable-issues --disable-wiki
fi

PAGES_TEMP_DIR=$(mktemp -d "${TMPDIR:-/tmp}/calendar-pages.XXXXXX")
trap 'rm -rf -- "$PAGES_TEMP_DIR"' EXIT
DEPLOY_DIR="$PAGES_TEMP_DIR/repository"

gh repo clone "$FULL_REPOSITORY" "$DEPLOY_DIR" -- --depth 1
git -C "$DEPLOY_DIR" checkout -B main
git -C "$DEPLOY_DIR" rm -r --ignore-unmatch . >/dev/null 2>&1 || true
cp -R dist/. "$DEPLOY_DIR/"

git -C "$DEPLOY_DIR" config user.name "Pages Publisher"
git -C "$DEPLOY_DIR" config user.email "pages@users.noreply.github.com"
git -C "$DEPLOY_DIR" add -A

if ! git -C "$DEPLOY_DIR" diff --cached --quiet; then
  git -C "$DEPLOY_DIR" commit -m "deploy: update static site"
  git -C "$DEPLOY_DIR" push -u origin main
else
  print "线上构建产物已经是最新版本。"
fi

if ! gh api "repos/$FULL_REPOSITORY/pages" >/dev/null 2>&1; then
  print "正在启用 GitHub Pages……"
  gh api --method POST "repos/$FULL_REPOSITORY/pages" \
    -f build_type=legacy \
    -f 'source[branch]=main' \
    -f 'source[path]=/' >/dev/null
fi

print "测试版已上传：https://${PAGES_OWNER:l}.github.io/$PAGES_REPOSITORY/"
