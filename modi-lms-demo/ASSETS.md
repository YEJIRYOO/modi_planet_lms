# 브랜드 · 이미지 자산 출처

이 데모가 쓰는 로고와 사진은 **`modi_planet_3.0` 레포**(`web/assets/`)에서 그대로 가져왔습니다.
원본 출처와 제약은 그 레포의 `web/assets/brand/SOURCES.md`,
`web/assets/lesson-visuals/SOURCES.md` 에 정리돼 있습니다.

## 가져온 파일

| 이 레포 경로 | 원본 (modi_planet_3.0) | 쓰이는 곳 |
| --- | --- | --- |
| `public/brand/logo.svg` | `web/assets/brand/logo.svg` | 사이드바 · 로그인 워드마크 |
| `public/brand/favicon.ico` | `web/assets/brand/favicon.ico` | 브라우저 파비콘 |
| `public/brand/beginner-thumbnail.png` | 〃 `brand/` | 홈 난이도 카드 (초급) |
| `public/brand/intermediate-thumbnail.png` | 〃 `brand/` | 홈 난이도 카드 (중급) |
| `public/brand/advanced-thumbnail.png` | 〃 `brand/` | 홈 난이도 카드 (고급) |
| `public/brand/ai-thumbnail.png` | 〃 `brand/` | (미사용 — AI LAB 용으로 확보) |
| `public/visuals/modi-ecosystem.jpg` | `web/assets/lesson-visuals/modi-ecosystem.jpg` | 홈 히어로 대표 이미지 |

`brand/` 6개 파일은 내려받은 뒤 `SOURCES.md` 의 SHA-256 무결성 기록과 대조해
원본과 동일함을 확인했습니다.

## 지켜야 할 것

- **`logo.svg` 는 원본 그대로 쓴다.** 재색상 · 왜곡 · 크롭 · 심볼과 워드마크 분리 ·
  재작도 · 대체 금지. 가로세로 비율과 내장 색(`#ff4438`, `#3e3a39`)을 유지한다.
  → 이 규정 때문에 자체 제작 마크(`BrandMark`)를 걷어내고 공식 로고로 교체했습니다.
  또 접힌 레일(≤760px)에서는 공식 favicon 이 16×16 뿐이라 확대하지 않고 로고를 숨깁니다.
- 파일이 공개 저장소에 있다는 것이 상표·재배포 허락은 아닙니다.
  **외부 공개 배포 전에 LUXROBO/MODI 브랜드 사용 허가를 확인**하세요.
- `modi-ecosystem.jpg` 는 사내 제품 촬영 컷의 리사이즈본입니다.

## 폰트

Pretendard 는 CDN(jsDelivr, dynamic subset)에서 불러옵니다.
`modi_planet_3.0` 레포에 `web/assets/brand/PretendardVariable.woff2`(2.2MB, 전체 웨이트)가
있으므로, 오프라인이나 폐쇄망 시연이 필요하면 그 파일로 자체 호스팅할 수 있습니다.
