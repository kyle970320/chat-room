import { useState, type ReactNode } from "react";

import { cn } from "../../shared/lib/variants";
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../shared/ui/base/select";

import type { SelectOptionType } from "../../shared/type";

interface SelectOption extends SelectOptionType {
  disabled?: boolean;
}

interface SelectProps extends React.ComponentProps<typeof SelectPrimitive> {
  direction?: "row" | "col";
  containerClass?: string;
  options: SelectOption[];
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  disabledItemClassName?: string;
  label?: string;
  labelClassName?: string;
  disabled?: boolean;
  className?: string;
  value?: string;
  canReset?: boolean;
  onValueChange?: (value: string) => void;
  onReset?: () => void;
}

interface SelectGroupProps extends React.ComponentProps<
  typeof SelectPrimitive
> {
  children: ReactNode;
  className?: string;
  label?: string;
  labelClassName?: string;
}

const Select = ({
  direction = "col",
  containerClass = "",
  options,
  placeholder = "선택해 주세요",
  triggerClassName = "",
  contentClassName = "",
  itemClassName = "",
  disabledItemClassName = "",
  label,
  labelClassName = "",
  disabled,
  className = "w-50",
  canReset = false,
  onReset,
  ...props
}: SelectProps) => {
  const resetValue = () => {
    props.onValueChange?.("");
    onReset?.();
  };
  const [focusedBorder, setFocusedBorder] = useState<string>("border-gray-300");

  const onSelectChange = (v: string) => {
    if (!v) {
      return;
    }
    props.onValueChange?.(v);
  };

  const wrapperClass =
    direction === "row" ? "flex items-center gap-2" : "flex flex-col gap-1";

  return (
    <div className={cn(wrapperClass, className, containerClass)}>
      {label && (
        <label
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            labelClassName,
          )}
        >
          {label}
        </label>
      )}
      <SelectPrimitive
        value={props.value}
        disabled={disabled}
        {...props}
        onValueChange={onSelectChange}
      >
        <SelectTrigger
          className={cn(
            "h-8 px-2 py-1 no-copy-text",
            triggerClassName,
            focusedBorder,
          )}
          onFocus={() => {
            setFocusedBorder("border-blue-600");
          }}
          onBlur={() => {
            setFocusedBorder("border-gray-300");
          }}
          value={props.value}
          resetValue={resetValue}
          canReset={canReset}
        >
          <SelectValue className="font-medium" placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className={cn(
            "bg-white  py-1 mt-0.25 w-full min-w-0",
            contentClassName,
          )}
        >
          <SelectGroup>
            {options.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
                disabled={option.disabled || false}
                className={cn(
                  "px-1 py-1.5 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 focus:bg-neutral-100 rounded transition w-full",
                  itemClassName,
                  option.disabled &&
                    cn(
                      "opacity-50 cursor-not-allowed text-gray-300 bg-white",
                      disabledItemClassName,
                    ),
                )}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </SelectPrimitive>
    </div>
  );
};

const SelectGroupComponent = ({
  children,
  label,
  labelClassName,
  ...props
}: SelectGroupProps) => {
  return (
    <div className="space-y-0.5">
      {label && (
        <SelectLabel
          className={cn("text-sm font-medium leading-none", labelClassName)}
        >
          {label}
        </SelectLabel>
      )}
      <SelectPrimitive {...props}>{children}</SelectPrimitive>
    </div>
  );
};

export {
  Select,
  SelectGroupComponent as SelectGroup,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectOption,
};
