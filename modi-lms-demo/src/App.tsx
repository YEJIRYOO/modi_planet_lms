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
