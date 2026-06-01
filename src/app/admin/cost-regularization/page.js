import CostRegularizationClient from '@/components/Admin/CostRegularization';

export const metadata = {
  title: 'Regularización de costes manuales',
};

export default function CostRegularizationPage() {
  return (
    <div className="flex h-full flex-col p-6">
      <CostRegularizationClient />
    </div>
  );
}
