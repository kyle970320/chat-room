import { forwardRef, type ReactNode, useId, useState } from "react";

// base
import { Input as InputPrimitive } from "../../shared/ui/base/input";

// lib
import { cn } from "../../shared/lib/variants";

// icon
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  disabled?: boolean;
  status?: "default" | "success" | "error";
  message?: string;
  label?: string;
  type?: "text" | "number" | "date" | "password" | "email" | "money";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      placeholder,
      disabled,
      status = "default",
      message,
      label,
      type = "text",
      id,
      leftIcon,
      rightIcon,
      showPasswordToggle = true,
      onChange,
      ...props
    },
    ref,
  ) => {
    const randomId = useId();
    const inputId = id || `input-${randomId}`;
    const [showPassword, setShowPassword] = useState(false);

    const getStatusStyles = () => {
      switch (status) {
        case "success":
          return "border-green-500 focus-visible:ring-green-500";
        case "error":
          return "border-red-500 focus-visible:ring-red-500";
        default:
          return "";
      }
    };

    const getMessageStyles = () => {
      switch (status) {
        case "success":
          return "text-green-600";
        case "error":
          return "text-red-500";
        default:
          return "text-muted-foreground";
      }
    };

    // password 타입이고 showPasswordToggle이 true일 때 토글 아이콘 표시
    const shouldShowPasswordToggle = type === "password" && showPasswordToggle;
    const actualType = type === "password" && showPassword ? "text" : type;

    // 우측 아이콘이 있으면 그것을 우선, 없으면 비밀번호 토글 아이콘 표시
    const finalRightIcon =
      rightIcon ||
      (shouldShowPasswordToggle ? (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      ) : null);

    // number, money 타입 입력 제한 & 포맷 처리
    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (
      event,
    ) => {
      const originalOnChange = onChange;
      const inputType = type;
      const { value } = event.target;

      // 숫자/소수점만 허용
      if (inputType === "number" || inputType === "money") {
        let sanitized = value.replace(/[^0-9.]/g, "");

        const parts = sanitized.split(".");
        if (parts.length > 2) {
          sanitized = parts[0] + "." + parts.slice(1).join("");
        }

        if (inputType === "money") {
          const digitsOnly = sanitized.replace(/\D/g, "");
          if (digitsOnly.length === 0) {
            event.target.value = "";
          } else {
            const withCommas = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            event.target.value = withCommas;
          }
        } else {
          // number 타입
          event.target.value = sanitized;
        }
      }

      if (originalOnChange) {
        originalOnChange(event);
      }
    };

    return (
      <div className="w-full space-y-2">
        {label && (
          <p className="text-foreground text-sm font-medium">{label}</p>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 transform">
              {leftIcon}
            </div>
          )}
          <InputPrimitive
            id={inputId}
            type={
              actualType === "money" || actualType === "number"
                ? "text"
                : actualType
            }
            className={cn(
              "w-full",
              leftIcon && "pl-10",
              finalRightIcon && "pr-10",
              getStatusStyles(),
              className,
            )}
            placeholder={placeholder}
            disabled={disabled}
            ref={ref}
            onChange={handleChange}
            {...props}
          />
          {finalRightIcon && (
            <div className="text-muted-foreground absolute top-1/2 right-3 flex -translate-y-1/2 transform">
              {finalRightIcon}
            </div>
          )}
        </div>
        {message && (
          <p className={cn("mt-1 text-[12px]", getMessageStyles())}>
            {message}
          </p>
        )}
      </div>
    );
  },
);

export { Input };
