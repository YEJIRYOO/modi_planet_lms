#!/usr/bin/env bash
set -e

# 1) 타입 전용 파일 분리
cat > src/types.ts << 'EOF'
export type CourseType = 'HW' | 'SW' | 'HW_SW';
EOF

# 2) LearningTabs: CourseType를 types.ts에서 import (type import 명시)
cat > src/components/LearningTabs.tsx << 'EOF'
import { useState, useMemo } from 'react';
import type { CourseType } from '../types';
import ModitorTab from './ModitorTab';
import CodeEditorTab from './CodeEditorTab';
import VibeCodingTab from './VibeCodingTab';

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

# 3) App: CourseType를 types.ts에서 type import
cat > src/App.tsx << 'EOF'
import { useState } from 'react';
import type { CourseType } from './types';
import LearningTabs from './components/LearningTabs';

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

echo "✅ 타입 분리 완료:"
echo "--- src/types.ts ---"; cat src/types.ts
echo "--- App.tsx import 확인 ---"; grep -n "import" src/App.tsx
echo "--- LearningTabs import 확인 ---"; grep -n "import" src/components/LearningTabs.tsx
