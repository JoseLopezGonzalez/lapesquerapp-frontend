import * as React from 'react';

declare const Breadcrumb: React.FC<React.ComponentPropsWithoutRef<'nav'>>;
declare const BreadcrumbList: React.FC<React.ComponentPropsWithoutRef<'ol'>>;
declare const BreadcrumbItem: React.FC<React.ComponentPropsWithoutRef<'li'>>;
declare const BreadcrumbLink: React.FC<
  React.ComponentPropsWithoutRef<'a'> & { asChild?: boolean }
>;
declare const BreadcrumbPage: React.FC<React.ComponentPropsWithoutRef<'span'>>;
declare const BreadcrumbSeparator: React.FC<React.ComponentPropsWithoutRef<'li'>>;
declare const BreadcrumbEllipsis: React.FC<React.ComponentPropsWithoutRef<'span'>>;

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
