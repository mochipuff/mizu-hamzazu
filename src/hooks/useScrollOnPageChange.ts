import { useEffect, useRef } from 'react';
import type { PageId } from '../i18n/pages.ts';

/** A new page opens at its top, or at the section named in the URL (`/en/#faq`). The first page the visitor loads is left to the browser. */
export function useScrollOnPageChange(page: PageId): void {
  const previous = useRef(page);

  useEffect(() => {
    if (previous.current === page) return;
    previous.current = page;

    const target = document.getElementById(window.location.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page]);
}
