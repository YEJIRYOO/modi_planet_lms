#!/usr/bin/env bash
# MODI LMS 데모 - 소스 파일 자동 생성 스크립트
# 사용법: 이 파일을 프로젝트 루트(modi-lms-demo)에 두고  bash setup-modi-lms.sh  실행
set -e

mkdir -p src/config src/components

cat > src/config/urls.ts << 'EOF'
const env = import.meta.env as any;
export const MODITOR_URL =
  env.VITE_MODITOR_URL || 'https://test-moditor.modiplanet.com/';
export const MOCKLY_URL =
  env.VITE_MOCKLY_URL || 'https://dev-moditor.modiplanet.com/';
export const VIBE_CODING_URL =
  (env.VITE_VIBE_CODING_URL || 'https://ai.modiplanet.com').replace(/\/$/, '');
EOF

cat > src/components/ModitorTab.tsx << 'EOF'
import { useMemo } from 'react';
import { MODITOR_URL } from '../config/urls';

interface ModitorTabProps { locale?: string; debug?: boolean; }

export default function ModitorTab({ locale = 'ko', debug = false }: ModitorTabProps) {
  const src = useMemo(
    () => `${MODITOR_URL}?locale=${locale}${debug ? '&debug=true' : ''}`,
    [locale, debug],
  );
  return (
    <iframe
      src={src}
      title="모디 블록 에디터"
      allow="serial; usb; bluetooth; clipboard-write"
      style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
    />
  );
}
EOF

cat > src/components/CodeEditorTab.tsx << 'EOF'
import { useMemo } from 'react';
import { MOCKLY_URL } from '../config/urls';

interface CodeEditorTabProps { mode?: string; locale?: string; }

export default function CodeEditorTab({ mode = '', locale = 'ko' }: CodeEditorTabProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({
      sidebar: 'hide', header: 'hide', mode, locale,
      blockly_scale: '0.8', is_lms: 'true',
    });
    return `${MOCKLY_URL}?${params.toString()}`;
  }, [mode, locale]);
  return (
    <iframe
      src={src}
      title="코드 에디터"
      allow="serial; usb; bluetooth; clipboard-write"
      style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
    />
  );
}
EOF

cat > src/components/VibeCodingTab.tsx << 'EOF'
export default function VibeCodingTab() {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      border: '1px dashed #cbd5e1', borderRadius: 12, color: '#64748b',
    }}>
      바이브 코딩 (수정 예정)
    </div>
  );
}
EOF

cat > src/components/LearningTabs.tsx << 'EOF'
import { useState, useMemo } from 'react';
import ModitorTab from './ModitorTab';
import CodeEditorTab from './CodeEditorTab';
import VibeCodingTab from './VibeCodingTab';

export type CourseType = 'HW' | 'SW' | 'HW_SW';
type TabKey = 'vibe' | 'preview' | 'code' | 'modi' | 'design' | 'note';

const TAB_LABEL: Record<TabKey, string> = {
  vibe: '바이브 코딩',
  preview: '미리보기',
  code: '코드 에디터',
  modi: '모디',
  design: '설계 문서',
  note: '학습 노트',
};

const TABS_BY_TYPE: Record<CourseType, TabKey[]> = {
  HW: ['vibe', 'code', 'modi', 'design', 'note'],
  SW: ['vibe', 'preview', 'design', 'note'],
  HW_SW: ['vibe', 'preview', 'code', 'modi', 'design', 'note'],
};

function Placeholder({ label }: { label: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      border: '1px dashed #cbd5e1', borderRadius: 12, color: '#94a3b8',
    }}>
      {label} (자리표시)
    </div>
  );
}

interface LearningTabsProps {
  courseType: CourseType;
  codeEditorMode?: string;
  locale?: string;
}

export default function LearningTabs({ courseType, codeEditorMode = '', locale = 'ko' }: LearningTabsProps) {
  const tabs = useMemo(() => TABS_BY_TYPE[courseType], [courseType]);
  const [active, setActive] = useState<TabKey>(tabs[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 560 }}>
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e2e8f0', marginBottom: 12 }}>
        {tabs.map((key) => (
          <button key={key} onClick={() => setActive(key)}
            style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              background: active === key ? '#fff' : 'transparent',
              borderBottom: active === key ? '2px solid #3b82f6' : '2px solid transparent',
              fontWeight: active === key ? 600 : 400,
              color: active === key ? '#1e293b' : '#64748b',
            }}>
            {TAB_LABEL[key]}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        {active === 'code' && <CodeEditorTab mode={codeEditorMode} locale={locale} />}
        {active === 'modi' && <ModitorTab locale={locale} />}
        {active === 'vibe' && <VibeCodingTab />}
        {active === 'preview' && <Placeholder label={TAB_LABEL.preview} />}
        {active === 'design' && <Placeholder label={TAB_LABEL.design} />}
        {active === 'note' && <Placeholder label={TAB_LABEL.note} />}
      </div>
    </div>
  );
}
EOF

cat > src/App.tsx << 'EOF'
import { useState } from 'react';
import LearningTabs, { CourseType } from './components/LearningTabs';

export default function App() {
  const [type, setType] = useState<CourseType>('HW');

  return (
    <div style={{ height: '100vh', padding: 16, boxSizing: 'border-box', fontFamily: 'system-ui' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ marginRight: 8 }}>강좌 유형:</span>
        {(['HW', 'SW', 'HW_SW'] as CourseType[]).map((t) => (
          <button key={t} onClick={() => setType(t)}
            style={{ marginRight: 6, padding: '4px 10px',
              background: type === t ? '#3b82f6' : '#e2e8f0',
              color: type === t ? '#fff' : '#334155',
              border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ height: 'calc(100% - 48px)' }}>
        <LearningTabs courseType={type} codeEditorMode="" locale="ko" />
      </div>
    </div>
  );
}
EOF

echo ""
echo "✅ 완료. 생성된 파일:"
wc -l src/App.tsx src/config/urls.ts src/components/*.tsx
echo ""
echo "이제 브라우저(localhost:5173) 새로고침하세요."
