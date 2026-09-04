#!/usr/bin/env node
/**
 * build-excerpts.mjs — 소스에 심어둔 주석 마커를 읽어 교습용 발췌 목록을 만듭니다.
 *
 * 소스 안에 이렇게 표시해 두면:
 *
 *   // #region step:2 title:기울기를 이동 방향으로 바꾸기
 *   ... 코드 ...
 *   // #endregion
 *
 * 아래처럼 줄 번호가 붙은 JSON이 나옵니다:
 *
 *   { "file": "modi1942.js", "step": 2, "title": "...", "from": 39, "to": 63 }
 *
 * 발췌 범위를 손으로 관리하지 않는 것이 핵심입니다. 게임 코드를 고쳐서 줄이
 * 밀려도 다시 돌리기만 하면 줄 번호가 맞춰집니다.
 *
 * 사용법:  node build-excerpts.mjs <코스폴더>
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const START = /^\s*(?:\/\/|#)\s*#region\s+step:(\d+)\s+title:(.+?)\s*$/;
const END = /^\s*(?:\/\/|#)\s*#endregion\s*$/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(js|mjs|py)$/.test(name) && !name.startsWith('build-')) out.push(path);
  }
  return out;
}

function extract(root) {
  const excerpts = [];
  for (const path of walk(root)) {
    const lines = readFileSync(path, 'utf8').split('\n');
    let open = null;
    lines.forEach((line, index) => {
      const start = line.match(START);
      if (start) {
        open = { step: Number(start[1]), title: start[2], from: index + 2 };
        return;
      }
      if (open && END.test(line)) {
        excerpts.push({
          file: relative(root, path),
          step: open.step,
          title: open.title,
          from: open.from,
          to: index, // 마커 줄은 제외하고 내용만
        });
        open = null;
      }
    });
    if (open) {
      console.warn(`⚠ ${relative(root, path)}: step:${open.step} 의 #endregion 이 없습니다`);
    }
  }
  return excerpts.sort((a, b) => a.step - b.step);
}

const root = process.argv[2] || '.';
const excerpts = extract(root);
const target = join(root, 'excerpts.json');
writeFileSync(target, JSON.stringify(excerpts, null, 2) + '\n');
console.log(`${excerpts.length}개 발췌를 ${target} 에 기록했습니다.`);
for (const item of excerpts) {
  console.log(`  step ${item.step}  ${item.file}:${item.from}-${item.to}  ${item.title}`);
}
