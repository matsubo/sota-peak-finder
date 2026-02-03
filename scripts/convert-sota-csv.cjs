#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// CSVファイルのパス
const csvPath = process.argv[2] || '/tmp/sota-summits.csv';
const outputPath = path.join(__dirname, '../public/data/sota-data.json');

console.log(`Reading CSV from: ${csvPath}`);
console.log(`Output will be saved to: ${outputPath}`);

// CSVを読み込み
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

// ヘッダー行をスキップ（最初の2行）
const dataLines = lines.slice(2);

// 日本（JA）のデータのみフィルタリングして変換
const jaSummits = [];
let lineNumber = 3; // 実際のデータは3行目から

for (const line of dataLines) {
  if (!line.trim() || !line.startsWith('JA/')) {
    continue;
  }

  try {
    // CSVパース（簡易版 - ダブルクォート内のカンマに対応）
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim()); // 最後の要素を追加

    if (parts.length < 11) {
      console.warn(`Line ${lineNumber}: Invalid format (${parts.length} fields)`);
      continue;
    }

    const [
      summitCode,
      associationName,
      regionName,
      summitName,
      altM,
      altFt,
      gridRef1,
      gridRef2,
      longitude,
      latitude,
      points,
      bonusPoints,
      validFrom,
      validTo,
      activationCount
    ] = parts;

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const altitude = parseInt(altM, 10);
    const pts = parseInt(points, 10);
    const activations = activationCount ? parseInt(activationCount, 10) : 0;
    const bonus = bonusPoints ? parseInt(bonusPoints, 10) : null;

    // 有効な数値かチェック
    if (isNaN(lat) || isNaN(lon) || isNaN(altitude) || isNaN(pts)) {
      console.warn(`Line ${lineNumber}: Invalid numeric values`);
      continue;
    }

    jaSummits.push({
      ref: summitCode,
      name: summitName.replace(/^"|"$/g, ''), // 日本語名がない場合は英語名
      nameEn: summitName.replace(/^"|"$/g, ''),
      lat,
      lon,
      altitude,
      points: pts,
      activations,
      bonus
    });
  } catch (error) {
    console.warn(`Line ${lineNumber}: Parse error - ${error.message}`);
  }

  lineNumber++;
}

// JSON形式で保存
const sotaData = {
  version: '1.0.0',
  lastUpdate: new Date().toISOString().split('T')[0],
  region: 'JA',
  summits: jaSummits
};

fs.writeFileSync(outputPath, JSON.stringify(sotaData, null, 2), 'utf-8');
console.log(`✅ SOTA data converted: ${jaSummits.length} summits saved to ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
