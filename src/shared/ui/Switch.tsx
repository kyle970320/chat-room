import { BaseSwitch } from "@/shared/ui/base/switch";

interface SwitchProps {
  label?: string;
  labelClassName?: string;
  disabled?: boolean;
}

export const Switch = (props: SwitchProps) => {
  const { label, labelClassName, disabled = false } = props;
  return (
    <div className="flex items-center space-x-2">
      <BaseSwitch id="airplane-mode" disabled={disabled} />
      {label && <p className={labelClassName}>{label}</p>}
    </div>
  );
};
