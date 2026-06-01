import { Suspense } from 'react';
import FieldAutoventaWizard from '@/components/Field/FieldAutoventaWizard';
import Loader from '@/components/Utilities/Loader';

export default function FieldAutoventaPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col p-4 sm:p-6">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <Loader />
          </div>
        }
      >
        <FieldAutoventaWizard />
      </Suspense>
    </div>
  );
}
