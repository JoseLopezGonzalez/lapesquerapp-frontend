import type { HTMLAttributes } from 'react';

type FieldDivComponent = React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

type FieldSetComponent = React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLFieldSetElement> & React.RefAttributes<HTMLFieldSetElement>
>;

type FieldLegendComponent = React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLLegendElement> & { variant?: 'legend' | 'label' } & React.RefAttributes<HTMLLegendElement>
>;

type FieldParagraphComponent = React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>
>;

type FieldComponent = React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & {
    orientation?: 'vertical' | 'horizontal' | 'responsive';
  } & React.RefAttributes<HTMLDivElement>
>;

type FieldErrorComponent = React.ForwardRefExoticComponent<
  HTMLAttributes<HTMLDivElement> & {
    errors?: Array<{ message?: string } | null | undefined>;
  } & React.RefAttributes<HTMLDivElement>
>;

declare const Field: FieldComponent;
declare const FieldLabel: FieldDivComponent;
declare const FieldDescription: FieldParagraphComponent;
declare const FieldError: FieldErrorComponent;
declare const FieldGroup: FieldDivComponent;
declare const FieldLegend: FieldLegendComponent;
declare const FieldSeparator: FieldDivComponent;
declare const FieldSet: FieldSetComponent;
declare const FieldContent: FieldDivComponent;
declare const FieldTitle: FieldDivComponent;

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
