#!/bin/bash

# プレースホルダーアイコンを生成するスクリプト
# ImageMagickが必要です: brew install imagemagick

if ! command -v convert &> /dev/null; then
    echo "ImageMagickがインストールされていません。"
    echo "インストール方法:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt install imagemagick"
    echo ""
    echo "または、create-icons.html をブラウザで開いてアイコンを生成してください。"
    exit 1
fi

# 192x192のアイコンを生成
convert -size 192x192 xc:"#2196F3" \
    -fill white \
    -gravity center \
    -pointsize 48 \
    -annotate +0+0 "QTH" \
    icon-192.png

# 512x512のアイコンを生成
convert -size 512x512 xc:"#2196F3" \
    -fill white \
    -gravity center \
    -pointsize 128 \
    -annotate +0+0 "QTH" \
    icon-512.png

echo "アイコンを生成しました:"
echo "  - icon-192.png"
echo "  - icon-512.png"
