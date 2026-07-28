import { getTranslations } from 'next-intl/server';
import { blogAuthor } from '@/lib/blog/blogAuthor';

export default async function AuthorByline() {
  const t = await getTranslations('Blog');

  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
      <span>{t('byLabel')}</span>
      <span className="text-foreground font-medium">{blogAuthor.name}</span>
      <span aria-hidden="true">·</span>
      <span>{blogAuthor.role}</span>
    </div>
  );
}
