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
