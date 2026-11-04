import { cn } from '@/lib/utils';

export function Avatar({ employee, size = 'md' }: { employee: { firstName: string; lastName: string; photoUrl: string | null }; size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'size-8 text-caption', md: 'size-10 text-label', lg: 'size-20 text-section-title' }[size];
  if (employee.photoUrl) return <AuthImage src={employee.photoUrl} alt="" className={cn('shrink-0 rounded-pill object-cover', cls)} />;
  return <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-pill bg-accent-tint font-semibold text-accent', cls)}>{employee.firstName.slice(0, 1)}</span>;
}

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

/** Photos are served only to signed-in users, so they are fetched with the access token. */
function AuthImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let revoke: string | null = null;
    api
      .get(src.replace(/^\/api/, ''), { responseType: 'blob' })
      .then((r) => {
        revoke = URL.createObjectURL(r.data);
        setUrl(revoke);
      })
      .catch(() => setUrl(null));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [src]);
  return url ? <img src={url} alt={alt} className={className} /> : <span className={cn('block bg-surface-sunken', className)} />;
}
