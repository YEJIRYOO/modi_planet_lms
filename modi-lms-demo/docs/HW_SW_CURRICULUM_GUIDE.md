# HW+SW 커리큘럼 등록 및 동작 가이드

이 문서는 이 저장소에 새로운 HW+SW 커리큘럼을 추가하는 개발자를 위한 안내서다. 현재 HW+SW 강좌는 정적 커리큘럼 데이터를 사용하며, 신규 강좌의 하드웨어 미리보기는 사용자의 별도 설치가 필요 없는 **브라우저 Web Serial 방식**을 권장한다.

## 1. 전체 동작 흐름

```text
src/data/courses.ts
  └─ 강좌 목록과 상세 화면에 강좌 노출
       └─ /learning/:courseId
            └─ src/data/hybridCurriculum.ts에서 같은 courseId 탐색
                 ├─ 준비물: 필수 모듈과 실제 탐색 모듈 비교
                 ├─ 바이브 코딩: 세 키워드 정적 매칭
                 ├─ 코드 보기: codeFiles 표시
                 ├─ 미리보기: 브라우저 또는 로컬 서버 UI 실행
                 └─ 학습 노트: notes 표시
```

HW+SW 바이브 코딩은 실제 AI API를 호출하지 않는다. `src/lib/staticVibe.ts`가 사용자의 문장에서 `keywords[].synonyms`를 찾아 진행도를 누적한다. 세 키워드가 모두 매칭되면 코드 보기, 미리보기, 학습 노트가 열린다.

## 2. 기본 등록 체크리스트

새 강좌 하나를 등록할 때 최소한 다음 작업이 필요하다.

1. `src/data/courses.ts`에 강좌 카드 정보를 추가한다.
2. `src/data/hybridCurriculum.ts`에 같은 ID의 `HybridCurriculum`을 추가한다.
3. 새 커리큘럼을 `HYBRID_CURRICULA` 배열에 등록한다.
4. 새로운 모듈 종류라면 `src/lib/modules.ts`와 `public/modules/`에 이름과 이미지를 등록한다.
5. 브라우저 하드웨어 미리보기가 필요하면 전용 React 컴포넌트를 만들고 `src/components/LearningTabs.tsx`에 연결한다.
6. 새로운 센서값이 필요하면 `src/lib/modiWebSerial.ts`에 요청 및 응답 해석을 추가한다.
7. 빌드, 린트, 브라우저, 실제 모듈 순서로 검증한다.

## 3. 강좌 목록 등록

파일: `src/data/courses.ts`

```ts
{
  id: '7',
  title: '새 HW+SW 강좌',
  description: '강좌 목록에 표시할 한 줄 설명',
  type: 'HW_SW',
  goal: '학생이 완성할 결과물',
  modules: ['imu', 'button'],
}
```

- `id`는 전체 `COURSES`에서 고유해야 한다.
- `type`은 반드시 `HW_SW`로 지정한다.
- `modules`는 카드 썸네일용이다. 실제 필수 모듈 판정은 커리큘럼의 `modules`가 담당한다.
- `modules`의 키는 `src/lib/modules.ts`의 `MODULE_INFO` 키와 일치해야 한다.

## 4. 정적 커리큘럼 등록

파일: `src/data/hybridCurriculum.ts`

```ts
const NEW_HYBRID_COURSE: HybridCurriculum = {
  courseId: '7',
  port: 0,
  folder: '',
  runCommand: '',
  modules: [
    {
      key: 'imu',
      role: '필수',
      reason: '기울기 입력을 받는다',
      count: 1,
    },
    {
      key: 'button',
      role: '필수',
      reason: '동작을 실행한다',
      count: 1,
    },
  ],
  mockNote: '브라우저 미리보기의 연결 조건과 제한을 설명한다.',
  examples: [
    '자이로를 기울이고 버튼을 누르는 앱을 만들고 싶어',
  ],
  keywords: [
    {
      label: '기울기',
      synonyms: ['기울', '자이로', 'imu', 'roll', 'pitch'],
      reply: '**기울기** 입력을 어떻게 처리하는지 설명한다.',
      hint: '어떤 센서로 어떤 값을 바꿀지 말해 보세요.',
    },
    {
      label: '버튼 입력',
      synonyms: ['버튼', '누름', '클릭', 'pressed'],
      reply: '**버튼 입력**을 어떻게 처리하는지 설명한다.',
      hint: '버튼을 언제 어떻게 사용할지 말해 보세요.',
    },
    {
      label: '결과 동작',
      synonyms: ['실행', '이동', '발사', '시작'],
      reply: '**결과 동작**을 어떻게 구현하는지 설명한다.',
      hint: '입력을 받으면 화면에서 무엇이 일어날까요?',
    },
  ],
  unlockReply: '세 항목이 모두 정해졌습니다. 코드와 미리보기를 확인하세요.',
  codeFiles: {
    'App.tsx': `// 학습자가 코드 보기 탭에서 볼 예제`,
    '점검표.md': `1. 연결 확인\n2. 입력 확인\n3. 결과 확인`,
  },
  notes: [
    {
      title: '입력과 상태',
      what: '센서 입력을 상태로 저장한다.',
      why: '화면이 최신 입력에 반응하도록 하기 위해서다.',
      where: '미리보기 컴포넌트의 센서 구독 부분',
    },
  ],
};
```

파일 아래쪽 배열에도 반드시 추가한다.

```ts
export const HYBRID_CURRICULA: HybridCurriculum[] = [
  F1942,
  TILT_MATCH,
  LOOP_STUDIO,
  TILT_CLICK_TEST,
  NEW_HYBRID_COURSE,
];
```

### 필드별 의미

| 필드 | 역할 | 주의사항 |
|---|---|---|
| `courseId` | 강좌와 커리큘럼 연결 키 | `courses.ts`의 `id`와 정확히 같아야 한다. |
| `port`, `folder`, `runCommand` | 기존 로컬 서버 미리보기 정보 | 브라우저 미리보기에서는 현재 사용하지 않지만 인터페이스상 필수다. 신규 강좌에는 `0`, 빈 문자열을 임시로 사용한다. |
| `modules` | 준비물 목록 및 필수 모듈 판정 | `필수`는 모두 필요하고 `선택`은 없어도 된다. 같은 `choiceGroup`의 `택1` 모듈은 하나 이상 필요하다. |
| `mockNote` | 연결 제약 안내 | 현재 서버 미리보기의 안내문으로도 사용된다. |
| `examples` | 바이브 코딩 시작 예시 | 예시 하나에 세 키워드를 모두 넣으면 한 번에 잠금 해제가 가능하다. |
| `keywords` | 프롬프트 매칭 규칙 | 현재 타입과 UI가 정확히 3개를 전제로 한다. |
| `unlockReply` | 세 키워드 완료 후 응답 | 다음 행동을 짧고 명확하게 안내한다. |
| `codeFiles` | 코드 보기 탭 내용 | 키는 파일 탭 이름, 값은 표시할 코드 문자열이다. 실제 실행 파일은 아니다. |
| `notes` | 학습 노트 탭 내용 | `title`, `what`, `why`, `where`를 모두 작성한다. |

## 5. 프롬프트 잠금 해제 규칙

파일: `src/lib/staticVibe.ts`

입력과 동의어는 다음 순서로 비교된다.

1. 모두 소문자로 변환한다.
2. 공백과 일부 문장부호를 제거한다.
3. 사용자의 문장에 동의어가 부분 문자열로 포함됐는지 확인한다.
4. 이전에 맞힌 키워드는 유지하고 새 키워드만 누적한다.
5. 세 키워드가 모두 누적되면 잠금이 해제된다.

따라서 동의어는 지나치게 짧은 한 글자보다 의도가 분명한 단어를 사용한다. 예를 들어 `값`, `해`, `켜` 같은 표현은 오탐 가능성이 높다. 한국어 표현, 모듈명, 개발 용어를 함께 넣으면 좋다.

```ts
synonyms: ['버튼', '누름', '클릭', 'pressed']
```

등록 후 다음 두 경우를 모두 시험한다.

- 한 문장에 세 개념을 모두 넣었을 때 한 번에 열리는가?
- 개념을 한 문장씩 세 번 입력했을 때 진행도가 정상 누적되는가?

## 6. 모듈 메타데이터와 이미지 추가

이미 등록된 모듈을 사용한다면 이 단계는 생략한다.

파일: `src/lib/modules.ts`

```ts
export const MODULE_INFO = {
  // ...
  new_sensor: { name: '새 센서', img: 'NewSensor.png' },
};
```

이미지 위치:

```text
public/modules/NewSensor.png
```

같은 모듈을 아래 위치에서 동일한 키로 사용해야 한다.

- `courses.ts`의 카드용 `modules`
- `hybridCurriculum.ts`의 준비물용 `modules[].key`
- `modiWebSerial.ts`의 `ModiModuleType` 및 UUID 타입 매핑

이미지가 없으면 이름은 표시되지만 카드와 준비물의 모듈 이미지가 비어 보일 수 있다.

## 7. 준비물 탭의 연결 판정

파일: `src/components/HybridPartsTab.tsx`

준비물 탭은 `modiWebSerial`의 전역 스냅샷을 구독한다. 사용자가 `MODI 연결`을 누르면 다음 과정이 진행된다.

1. Web Serial 장치 선택 창을 연다.
2. MODI+ Network Module을 921600 baud로 연다.
3. 모듈 ID/UUID 정보를 요청한다.
4. UUID로 모듈 종류를 판별한다.
5. 커리큘럼의 모든 `필수` 모듈과 각 `택1` 그룹에서 하나 이상의 모듈이 발견됐는지 비교한다.

서로 대체 가능한 모듈은 같은 `choiceGroup`으로 등록한다.

```ts
{ key: 'dial', role: '택1', reason: '연속값으로 볼륨을 조절한다', count: 1, choiceGroup: 'volume-control' },
{ key: 'joystick', role: '택1', reason: '위아래로 볼륨을 조절한다', count: 1, choiceGroup: 'volume-control' },
```

모듈 키 변환의 예외도 확인해야 한다.

- `motor_a`, `motor_b` → Web Serial 타입 `motor`
- `environment` → Web Serial 타입 `env`

동일 종류 모듈을 두 개 이상 요구하는 경우 현재 준비물 판정은 **종류의 존재 여부만 검사하고 개수는 검사하지 않는다.** `count: 2` 같은 커리큘럼이 필요하면 `HybridPartsTab.tsx`의 `missing` 계산을 개수 기반으로 확장해야 한다.

## 8. 브라우저 하드웨어 미리보기 추가

신규 HW+SW 강좌는 이 방식을 기본으로 사용한다. 사용자는 Python, 드라이버 패키지, 로컬 게임 서버를 설치하지 않는다. 준비물 탭에서 연결한 `modiWebSerial` 인스턴스를 미리보기에서도 그대로 구독한다.

### 8.1 전용 미리보기 컴포넌트 생성

예시 파일:

```text
src/components/NewCoursePreview.tsx
```

기본 형태:

```tsx
import { useSyncExternalStore } from 'react';
import { modiWebSerial } from '../lib/modiWebSerial';

export default function NewCoursePreview() {
  const device = useSyncExternalStore(
    modiWebSerial.subscribe,
    modiWebSerial.getSnapshot,
    modiWebSerial.getSnapshot,
  );

  const ready =
    device.status === 'connected' &&
    device.modules.some((module) => module.type === 'imu');

  if (!ready) return <div>준비물 탭에서 필요한 모듈을 연결하세요.</div>;

  return <div>Roll: {device.imu?.roll ?? 0}</div>;
}
```

연결 객체를 컴포넌트 안에서 새로 만들지 않는다. 준비물과 미리보기가 반드시 `src/lib/modiWebSerial.ts`의 싱글턴 `modiWebSerial`을 공유해야 탭 이동 후에도 USB 연결이 유지된다.

### 8.2 학습 탭에 미리보기 연결

파일: `src/components/LearningTabs.tsx`

현재 강좌 6은 아래처럼 ID를 직접 비교한다.

```tsx
courseId === '6'
  ? <BrowserHardwarePreview />
  : <GamePreviewTab cur={cur} />
```

새 브라우저 미리보기를 추가할 때는 import와 분기를 함께 추가해야 한다.

```tsx
courseId === '7'
  ? <NewCoursePreview />
  : courseId === '6'
    ? <BrowserHardwarePreview />
    : <GamePreviewTab cur={cur} />
```

이 ID 분기는 임시 구조다. 브라우저 미리보기 강좌가 늘어나면 `HybridCurriculum`에 `previewKind`를 추가하고 ID별 컴포넌트 레지스트리로 교체하는 것을 권장한다.

## 9. 새로운 센서 또는 출력 모듈 지원

파일: `src/lib/modiWebSerial.ts`

현재 브라우저 연결 계층은 다음을 제공한다.

- 네트워크, 배터리, 환경, IMU, 버튼, 다이얼, 조이스틱, ToF, 디스플레이, 모터, LED, 스피커의 모듈 종류 탐색
- IMU `roll`, `pitch`, `yaw` 실시간값
- 버튼 `clicked`, `doubleClicked`, `pressed`, `toggled` 실시간값
- 다이얼 `turn`, `speed` 실시간값
- 조이스틱 `x`, `y`, `direction` 실시간값
- 환경 센서 `illuminance`, `temperature`, `humidity`, `volume` 실시간값
- ToF `distance` 실시간값
- LED RGB, 스피커 주파수·볼륨, 모터 속도 출력

목록에서 모듈이 보인다는 것과 센서값을 읽을 수 있다는 것은 별개다. 새로운 센서값을 미리보기에서 사용하려면 다음을 모두 구현한다.

1. `ModiSerialSnapshot`에 안정적인 UI용 값을 추가한다.
2. `snapshot` 초기값과 `disconnect()` 초기화값을 추가한다.
3. 해당 모듈에 property 요청 패킷을 보낸다.
4. `0x1f` property 응답의 property 번호와 바이트 배열을 해석한다.
5. `DataView` 사용 시 MODI 프로토콜의 little-endian 순서를 적용한다.
6. 길이 확인과 `Number.isFinite` 같은 입력 검증을 거친 후 스냅샷을 갱신한다.
7. 실제 모듈의 최솟값, 중립값, 최댓값을 확인한다.

프로토콜 상수와 바이트 오프셋을 추측해서 추가하지 않는다. MODI+ 펌웨어 또는 공식 `pymodi-plus` 구현의 해당 모듈 클래스를 기준으로 확인한다.

## 10. 기존 로컬 서버 미리보기

파일:

- `src/components/GamePreviewTab.tsx`
- `src/lib/gameServer.ts`

기존 강좌 3~5는 `127.0.0.1:<port>`의 별도 게임 서버를 찾는 구조다. 이 방식에서는 커리큘럼의 `port`, `folder`, `runCommand`가 실제로 사용된다.

로컬 서버는 사용자 환경에 Python과 게임 파일이 있어야 하므로 신규 일반 사용자용 강좌에는 권장하지 않는다. 부득이하게 사용할 경우 서버가 다음 조건을 만족해야 한다.

- `GET /`에서 iframe용 웹 화면 제공
- `GET /api/health`에서 JSON 제공
- LMS가 health 응답을 읽도록 `Access-Control-Allow-Origin` 헤더 제공
- health JSON에 `mode`, `connected`, `error` 포함
- 다른 강좌와 겹치지 않는 포트 사용

```json
{
  "mode": "real",
  "connected": true,
  "error": null
}
```

## 11. 브라우저 요구사항

Web Serial은 모든 브라우저에서 동작하지 않는다. 현재 UI도 다음 조건을 전제로 한다.

- 데스크톱 Chrome 또는 Edge
- HTTPS 배포 주소 또는 `localhost`
- 사용자의 명시적인 장치 선택
- 다른 프로그램이 같은 MODI USB 포트를 점유하지 않는 상태

장치 선택 창은 브라우저 보안 정책상 사용자 클릭 없이 자동으로 열 수 없다. 이미 권한을 준 장치는 `reconnectGranted()`로 재연결을 시도할 수 있다.

## 12. 검증 절차

### 정적 검증

```bash
npm run build
npx eslint \
  src/data/courses.ts \
  src/data/hybridCurriculum.ts \
  src/components/NewCoursePreview.tsx \
  src/components/LearningTabs.tsx \
  src/lib/modiWebSerial.ts
```

전체 `npm run lint`는 저장소의 기존 오류까지 함께 보고하므로, 작업 중에는 변경 파일 린트를 먼저 확인하고 마지막에 전체 린트도 실행한다.

### 화면 검증

1. 강좌 목록에 카드가 보이는지 확인한다.
2. 카드의 제목, 설명, 모듈 이미지가 맞는지 확인한다.
3. 상세 화면에서 HW+SW 배지가 보이는지 확인한다.
4. 학습 시작 후 준비물, 바이브 코딩, 코드 보기, 미리보기, 학습 노트 탭이 보이는지 확인한다.
5. 잠금 해제 전 코드 보기와 미리보기가 잠겨 있는지 확인한다.
6. 예시 프롬프트로 세 키워드가 모두 활성화되는지 확인한다.
7. 브라우저 미리보기가 Python이나 별도 로컬 서버 없이 열리는지 확인한다.

### 실제 하드웨어 검증

1. 네트워크 모듈에 필요한 모든 모듈을 연결하고 전원을 켠다.
2. 준비물 탭에서 MODI 장치를 선택한다.
3. 탐색된 모듈 이름과 ID를 확인한다.
4. 필수 모듈 하나를 분리했을 때 누락 안내가 나오는지 확인한다.
5. 다시 연결한 뒤 미리보기로 이동해 연결이 유지되는지 확인한다.
6. 각 센서의 중립, 최소, 최대 입력을 시험한다.
7. 버튼은 누름, 길게 누름, 뗌, 재입력을 각각 확인한다.
8. USB 분리 시 화면이 안전하게 연결 해제 상태로 돌아가는지 확인한다.

## 13. 자주 발생하는 문제

### 강좌 카드는 보이는데 정적 커리큘럼이 열리지 않는다

- `courses.ts`의 `id`와 `hybridCurriculum.ts`의 `courseId`가 같은지 확인한다.
- 새 상수를 `HYBRID_CURRICULA` 배열에 넣었는지 확인한다.

### 프롬프트를 입력해도 잠금이 풀리지 않는다

- 세 `keywords`의 동의어가 입력 문장에 실제로 포함됐는지 확인한다.
- 같은 단어가 의도치 않게 여러 키워드에 중복 등록되지 않았는지 확인한다.
- 예시 문장 자체에 세 키워드의 동의어가 모두 포함되는지 확인한다.

### 준비물 탭에서 모듈 이름 대신 키가 그대로 보인다

- `src/lib/modules.ts`의 `MODULE_INFO` 등록을 확인한다.

### 모듈은 목록에 보이지만 미리보기 값은 0이다

- 모듈 탐색만 구현되고 property 요청 또는 응답 디코딩이 빠졌을 가능성이 크다.
- 요청 property 번호, 응답 `message.d`, 데이터 길이와 바이트 오프셋을 확인한다.

### 미리보기에 계속 로컬 게임 실행 안내가 나온다

- `LearningTabs.tsx`에서 새 강좌가 브라우저 미리보기 컴포넌트로 분기되는지 확인한다.
- 분기가 없으면 기본값인 `GamePreviewTab`으로 들어간다.

### 연결 버튼이 비활성화되고 지원하지 않는 브라우저라고 나온다

- Chrome/Edge 데스크톱인지 확인한다.
- HTTPS 또는 localhost에서 실행 중인지 확인한다.

## 14. 완료 기준

다음 조건을 모두 만족하면 HW+SW 커리큘럼 등록이 완료된 것으로 본다.

- 강좌 카드와 상세 화면이 정상 노출된다.
- `courseId`로 정적 커리큘럼이 연결된다.
- 준비물의 필수 모듈 판정이 정확하다.
- 예시 프롬프트와 자유 입력 모두로 세 키워드를 완료할 수 있다.
- 코드 보기와 학습 노트에 실제 강좌 내용이 표시된다.
- 신규 강좌는 별도 로컬 설치 없이 브라우저 미리보기가 실행된다.
- 실제 모듈 입력이 화면 동작으로 이어진다.
- 장치 누락, 연결 해제, 지원하지 않는 브라우저 상태가 안전하게 안내된다.
- `npm run build`가 통과한다.
- 변경 파일의 ESLint 검사가 통과한다.
