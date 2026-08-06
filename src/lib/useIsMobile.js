import { useEffect, useState } from 'react';

// Breakpoint único do app — casa com o `md:` do Tailwind (768px), então o que
// o JS considera "mobile" é exatamente o que as classes `md:hidden` escondem.
export const MOBILE_BREAKPOINT = 768;

// Observa a largura da viewport via matchMedia (sem listener de resize, que
// dispara a cada pixel). Serve para trocar de layout quando CSS não basta —
// por exemplo, o cronograma que vira lista vertical no celular.
export const useIsMobile = (breakpoint = MOBILE_BREAKPOINT) => {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
};

export default useIsMobile;
