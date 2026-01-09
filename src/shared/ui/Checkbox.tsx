import { forwardRef, useId, useRef, type ReactNode } from "react";

// lib
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

import { Checkbox as BaseCheckbox } from "@/shared/ui/base/checkbox";

// variants
import { cn } from "@/shared/lib/variants";

interface CheckBoxProps extends React.ComponentProps<
  typeof CheckboxPrimitive.Root
> {
  label?: string;
  labelClassName?: string;
  customIcon?: ReactNode;
  disabled?: boolean;
}

interface CheckBoxGroupProps {
  children: ReactNode;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

const Checkbox = forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckBoxProps
>(({ className, label, labelClassName, disabled, ...props }, ref) => {
  const id = useId();
  const checkboxId = `checkbox-${id}`;
  const internalRef = useRef<HTMLButtonElement>(null);
  const checkboxRef = (ref ||
    internalRef) as React.RefObject<HTMLButtonElement>;

  const handleLabelClick = () => {
    if (!disabled && checkboxRef.current) {
      checkboxRef.current.click();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <BaseCheckbox
        ref={checkboxRef}
        id={checkboxId}
        className={className}
        disabled={disabled}
        {...props}
      />
      {label && (
        <div className="flex flex-col space-y-1">
          <label
            htmlFor={checkboxId}
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
});

const CheckBoxGroup = forwardRef<HTMLDivElement, CheckBoxGroupProps>(
  ({ children, className, orientation = "vertical", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "space-y-2",
          orientation === "horizontal" && "flex flex-wrap gap-4 space-y-0",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

export { Checkbox, CheckBoxGroup };
