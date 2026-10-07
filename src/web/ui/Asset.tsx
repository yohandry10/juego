import { useState } from "react";
import type { ReactNode } from "react";

export function Asset({ src, srcSet, alt, fallback, className = '', eager = false }: { src: string; srcSet?: string; alt: string; fallback: ReactNode; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className={`asset-fallback ${className}`} role="img" aria-label={alt}>{fallback}</div> : <img className={className} src={src} srcSet={srcSet} sizes="(max-width:600px) 480px, (max-width:1000px) 900px, 1600px" alt={alt} decoding="async" loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)}/>;
}
