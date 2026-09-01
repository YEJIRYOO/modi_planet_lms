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
