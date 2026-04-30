import CostRegularizationClient from '@/components/Admin/CostRegularization';

export const metadata = {
    title: 'Regularización de costes manuales',
};

export default function CostRegularizationPage() {
    return (
        <div className="h-full p-6 flex flex-col">
            <CostRegularizationClient />
        </div>
    );
}
