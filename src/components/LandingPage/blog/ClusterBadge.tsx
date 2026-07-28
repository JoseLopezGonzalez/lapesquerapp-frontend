import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import type { BlogCluster } from '@/types/blog';

export default async function ClusterBadge({ cluster }: { cluster: BlogCluster }) {
  const t = await getTranslations('Blog.clusters');
  return (
    <Badge variant="secondary" className="w-fit">
      {t(cluster)}
    </Badge>
  );
}
