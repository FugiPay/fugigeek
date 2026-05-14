import { useEffect } from 'react';

const BASE = 'Fugigeek';

export const usePageTitle = (title) => {
  useEffect(() => {
    // If title is undefined/null (data still loading), keep current title
    if (title === undefined || title === null) return;
    document.title = title ? `${title} — ${BASE}` : BASE;
    return () => { document.title = BASE; };
  }, [title]);
};
