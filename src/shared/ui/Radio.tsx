import { type ReactNode, forwardRef, useId, useRef } from "react";

// variants
import { cn } from "@/shared/lib/variants";
import { RadioGroupItem } from "@/shared/ui/base/radio-group";
// lib
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

interface RadioProps extends React.ComponentProps<
  typeof RadioGroupPrimitive.Item
> {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  indicatorClassName?: string;
  disabled?: boolean;
}

interface RadioGroupProps extends React.ComponentProps<
  typeof RadioGroupPrimitive.Root
> {
  children: ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

const Radio = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioProps
>(
  (
    {
      className,
      label,
      labelClassName,
      wrapperClassName,
      indicatorClassName,
      disabled,
      value,
      ...props
    },
    ref,
  ) => {
    const id = useId();
    const radioId = `radio-${id}`;
    const internalRef = useRef<HTMLButtonElement>(null);
    const radioRef = (ref || internalRef) as React.RefObject<HTMLButtonElement>;

    const handleLabelClick = () => {
      if (!disabled && radioRef.current) {
        radioRef.current.click();
      }
    };

    return (
      <div className={cn("flex items-center space-x-2", wrapperClassName)}>
        <RadioGroupItem
          ref={radioRef}
          id={radioId}
          value={value}
          className={className}
          disabled={disabled}
          indicatorClassName={indicatorClassName}
          {...props}
        />
        {label && (
          <div className="flex flex-col space-y-1">
            <label
              htmlFor={radioId}
              onClick={handleLabelClick}
              className={cn(
                "cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                disabled && "cursor-not-allowed opacity-50",
                labelClassName,
              )}
            >
              {label}
            </label>
          </div>
        )}
      </div>
    );
  },
);

const RadioGroup = forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ children, className, orientation = "vertical", ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn(
        "grid gap-3",
        orientation === "horizontal" && "flex flex-wrap gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Root>
  );
});

export { Radio, RadioGroup };
