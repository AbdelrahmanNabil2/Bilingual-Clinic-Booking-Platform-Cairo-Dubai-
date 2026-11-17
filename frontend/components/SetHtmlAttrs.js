'use client';

import { useEffect } from 'react';

export default function SetHtmlAttrs({ lang, dir }) {
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return null;
}
