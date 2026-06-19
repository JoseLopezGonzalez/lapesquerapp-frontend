import Image from 'next/image';
import { cn } from '@/lib/utils';

export function PalletIllustration({ className }: { className?: string }) {
  return (
    <Image
      src="/images/pallet.png"
      alt=""
      width={1000}
      height={715}
      className={cn('h-auto w-full', className)}
      aria-hidden
      unoptimized
    />
  );
}
