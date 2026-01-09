import {
  Tooltip as TooltipBase,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/base/tooltip";

interface TooltipProps {
  children: React.ReactNode;
  text?: React.ReactNode;
  content: React.ReactNode;
  position?: "top" | "bottom";
  className?: string;
  TriggerClassName?: string;
  arrowClassName?: string;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
  offsetX?: number;
  offsetY?: number;
  delayDuration?: number;
  asChild?: boolean;
}

export const Tooltip = (props: TooltipProps) => {
  const {
    children,
    text,
    content,
    position = "bottom",
    className = "",
    TriggerClassName = "",
    arrowClassName = "",
    contentClassName = "",
    contentStyle = {},
    offsetX = 0,
    offsetY = 5,
    delayDuration = 0,
    asChild = false,
  } = props;

  return (
    <TooltipBase delayDuration={delayDuration} disableHoverableContent>
      <TooltipTrigger className={TriggerClassName} asChild={asChild}>
        {children}
      </TooltipTrigger>
      <TooltipContent
        className={`bg-neutral-600 font-medium text-white ${className} `}
        arrowClassName={`bg-neutral-600 !fill-neutral-600 ${arrowClassName}`}
        side={position}
        sideOffset={-2}
        style={{
          transform: `translateX(${offsetX}px) translateY(${offsetY}px)`,
        }}
      >
        <div
          className="px-1.5 py-1 break-words whitespace-normal"
          style={contentStyle}
        >
          <p className={`${contentClassName}`}>
            {content && <span>{content}</span>}
            {text}
          </p>
        </div>
      </TooltipContent>
    </TooltipBase>
  );
};
