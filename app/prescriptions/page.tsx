import Header from '@/components/Header';
import { PrescriptionsContent } from '@/components/PrescriptionsContent';
import { Suspense } from 'react';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading prescriptions...</p>
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Suspense fallback={<LoadingFallback />}>
        <PrescriptionsContent />
      </Suspense>
    </div>
  );
}
