import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import AssetPlaceholder from '@/components/LandingPage/AssetPlaceholder';
import ScrollReveal from '@/components/LandingPage/ScrollReveal';
import ClusterBadge from './ClusterBadge';
import type { BlogArticleSummary } from '@/types/blog';

const DATE_LOCALES: Record<string, string> = { es: 'es-ES', pt: 'pt-PT', en: 'en-US' };

interface ArticleCardProps {
  article: BlogArticleSummary;
  locale: string;
  delay?: number;
}

export default function ArticleCard({ article, locale, delay = 0 }: ArticleCardProps) {
  const dateLocale = DATE_LOCALES[locale] ?? 'es-ES';
  const formattedDate = new Date(article.publishedAt).toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollReveal delay={delay}>
      <Link href={`/blog/${article.slug}`} className="block h-full">
        <Card className="hover:border-foreground/30 h-full transition-colors">
          <CardHeader className="pb-4">
            <ClusterBadge cluster={article.cluster} />
            <CardTitle className="mt-2 text-xl">{article.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <CardDescription className="text-base">{article.description}</CardDescription>
            <AssetPlaceholder
              type={3}
              label={article.coverPlaceholderLabel}
              className="aspect-video w-full"
            />
            <p className="text-muted-foreground text-xs">{formattedDate}</p>
          </CardContent>
        </Card>
      </Link>
    </ScrollReveal>
  );
}
