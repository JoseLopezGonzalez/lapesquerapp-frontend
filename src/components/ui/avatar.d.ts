import * as React from 'react';

declare const Avatar: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { size?: 'sm' | 'default' | 'lg' }
>;
declare const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>>;
declare const AvatarFallback: React.FC<React.HTMLAttributes<HTMLSpanElement>>;
declare const AvatarGroup: React.FC<React.HTMLAttributes<HTMLDivElement>>;
declare const AvatarGroupCount: React.FC<React.HTMLAttributes<HTMLDivElement>>;
declare const AvatarBadge: React.FC<React.HTMLAttributes<HTMLSpanElement>>;

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge };
