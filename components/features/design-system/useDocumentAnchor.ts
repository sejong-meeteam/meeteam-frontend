'use client';

import { useEffect } from 'react';

export function useDocumentAnchor(anchor: string) {
  useEffect(() => {
    document.getElementById(anchor)?.scrollIntoView({ block: 'start' });
  }, [anchor]);
}
