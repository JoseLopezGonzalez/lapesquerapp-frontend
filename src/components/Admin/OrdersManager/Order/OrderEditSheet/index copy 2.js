import React from 'react';
import { useForm } from 'react-hook-form';
import { useOrderFormConfig } from '@/hooks/useOrderFormConfig';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import DatePicker from '@/components/Shadcn/Dates/DatePicker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Edit, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const OrderEditSheet = ({ orderData }) => {
    const { defaultValues, formGroups } = useOrderFormConfig(orderData);
    const { register, handleSubmit, setValue, watch } = useForm({ defaultValues });

    const onSubmit = (data) => {
        console.log('Datos del formulario:', data);
        // Aquí llamas al service para actualizar el pedido
    };

    const renderField = (field) => {
        const commonProps = {
            id: field.name,
            placeholder: field.props?.placeholder || '',
            ...register(field.name),
        };

        switch (field.component) {
            case 'DatePicker':
                return (
                    <DatePicker
                        value={watch(field.name)}
                        onChange={(value) => setValue(field.name, value)}
                        {...field.props}
                    />
                );
            case 'Select':
                return (
                    <Select defaultValue={defaultValues[field.name]}>
                        <SelectTrigger>
                            <SelectValue placeholder={field.props?.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'Combobox':
                return (
                    <Combobox
                        options={field.options}
                        placeholder={field.props?.placeholder}
                        searchPlaceholder={field.props?.searchPlaceholder}
                        notFoundMessage={field.props?.notFoundMessage}
                        {...commonProps}
                    />
                );
            case 'Textarea':
                return <Textarea {...commonProps} className={field.props?.className} />;
            case 'Input':
            default:
                return <Input {...commonProps} />;
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Pedido
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[900px] sm:min-w-[600px] px-7 py-7">
                <SheetHeader>
                    <SheetTitle>Editar Pedido #{defaultValues.id || 'N/A'}</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                    <div className="grow grid gap-6 py-4 px-5 h-full overflow-y-auto">
                        {formGroups.map((group) => (
                            <div key={group.group}>
                                <h3 className="text-sm font-medium">{group.group}</h3>
                                <Separator className="my-2" />
                                {group.fields.map((field) => (
                                    <div key={field.name} className="grid gap-2 mb-4">
                                        <Label htmlFor={field.name}>{field.label}</Label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <SheetTrigger asChild>
                            <Button variant="outline" type="button">
                                Cancelar
                            </Button>
                        </SheetTrigger>
                        <Button type="submit">
                            <Save className="h-4 w-4 mr-2" />
                            Guardar cambios
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
};

export default OrderEditSheet;
