import * as React from "react";

// variants
import { buttonVariants, cn } from "@/shared/lib/variants";
import { Tooltip } from "@/shared/ui/Tooltip";
// lib
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | "outline"
    | "delete"
    | "save"
    | "edit"
    | "reset"
    | "search"
    | "file"
    | "pagination";
  className?: string;
  tooltip?: React.ReactNode;
  tooltipPosition?: "top" | "bottom";
  tooltipClassName?: string;
  tooltipContentClassName?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      variant = "outline",
      className,
      tooltip,
      tooltipPosition = "bottom",
      tooltipClassName,
      tooltipContentClassName,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const mergedClassName = cn(buttonVariants({ variant }), className);

    const buttonElement = (
      <Comp
        className={mergedClassName}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    );

    if (tooltip) {
      if (disabled) {
        return (
          <Tooltip
            content={tooltip}
            position={tooltipPosition}
            className={tooltipClassName}
            contentClassName={tooltipContentClassName}
          >
            <span className="inline-block">{buttonElement}</span>
          </Tooltip>
        );
      }

      return (
        <Tooltip
          content={tooltip}
          position={tooltipPosition}
          className={tooltipClassName}
          contentClassName={tooltipContentClassName}
          asChild={true}
        >
          {buttonElement}
        </Tooltip>
      );
    }

    return buttonElement;
  },
);
