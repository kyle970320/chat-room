interface ToggleSwitchPropsType {
  isOn: boolean;
  toggleSwitch: () => void;
  offText?: string;
  onText?: string;
  width?: string;
  height?: string;
  circleSize?: string;
  onColor?: {
    from: string;
    to: string;
  };
  offColor?: {
    from: string;
    to: string;
  };
  textPosition?: {
    on: string;
    off: string;
  };
}

export const ToggleSwitch = (props: ToggleSwitchPropsType) => {
  const {
    isOn,
    toggleSwitch,
    offText = "상하",
    onText = "좌우",
    width = "w-15",
    height = "h-6.5",
    circleSize = "w-4 h-4",
    onColor = { from: "#4ade80", to: "#22c55e" },
    offColor = { from: "#f87171", to: "#ef4444" },
  } = props;

  return (
    <button
      className={`relative ${width} ${height} rounded-full bg-white shadow-md flex items-center cursor-pointer transition-all duration-300 ease-in-out`}
      onClick={toggleSwitch}
      aria-pressed={isOn}
    >
      <div
        className={`absolute w-10 text-xs font-semibold text-red-600 transition-opacity duration-300 left-2/3 -translate-x-1/2 ${
          !isOn ? "opacity-100" : "opacity-0"
        }`}
      >
        {offText}
      </div>

      <div
        className={`absolute w-10 text-xs font-semibold text-green-700 transition-opacity duration-300 left-1/3 -translate-x-1/2 ${
          isOn ? "opacity-100" : "opacity-0"
        }`}
      >
        {onText}
      </div>

      <div
        className={`absolute ${circleSize} rounded-full shadow-md transition-transform duration-300 ease-in-out left-1 ${
          isOn ? "translate-x-8" : "translate-x-0"
        }`}
        style={{
          background: isOn
            ? `linear-gradient(to bottom right, ${onColor.from}, ${onColor.to})`
            : `linear-gradient(to bottom right, ${offColor.from}, ${offColor.to})`,
        }}
      />
    </button>
  );
};
