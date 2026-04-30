import CostRegularizationClient from '@/components/Admin/CostRegularization';

export const metadata = {
    title: 'Regularización de costes manuales',
};

export default function CostRegularizationPage() {
    return (
        <div className="p-6">
            <CostRegularizationClient />
        </div>
    );
}
