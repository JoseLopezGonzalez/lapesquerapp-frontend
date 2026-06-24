import * as React from 'react';

type OTPInputProps = {
  className?: string;
  containerClassName?: string;
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  pattern?: string;
  [key: string]: unknown;
};

declare const InputOTP: React.ForwardRefExoticComponent<
  OTPInputProps & React.RefAttributes<HTMLInputElement>
>;

declare const InputOTPGroup: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

declare const InputOTPSlot: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & { index: number } & React.RefAttributes<HTMLDivElement>
>;

declare const InputOTPSeparator: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
>;

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
