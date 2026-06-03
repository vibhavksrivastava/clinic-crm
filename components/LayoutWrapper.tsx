'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname =
    usePathname();

  const hideHeader = [
    '/',
    '/login',
    '/patient-login',
    '/doctor-login',
  ].includes(pathname);

  return (
    <>
      {!hideHeader && (
        <Header />
      )}

      {children}
    </>
  );
}