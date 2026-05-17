'use client';

import { Suspense } from 'react';
import PurchaseOrderContent from './PurchaseOrderContent';

export const dynamic = 'force-dynamic';

export default function CreatePurchaseOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center">
          Loading Purchase Order...
        </div>
      }
    >
      <PurchaseOrderContent />
    </Suspense>
  );
}