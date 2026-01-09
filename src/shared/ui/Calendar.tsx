// ui
import { Select } from "@/shared/ui/Select";
// config
import { formatDate, isDateInRange } from "@/widgets/datepicker/config/utils";

// icons
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarInputProps {
  currentDate: Date;
  range: boolean;
  rangeStart: string;
  rangeEnd: string;
  isSelectingEnd: boolean;
  handleDateSelect: (date: Date) => void;
  inputValue: string;
  calendarPosition: "start" | "end";
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  editDateSelect?: boolean;
  datePosition?: "top" | "bottom";
}

// 달력 렌더링
export const RenderCalendar = (props: CalendarInputProps) => {
  const {
    currentDate,
    range,
    rangeStart,
    rangeEnd,
    isSelectingEnd,
    handleDateSelect,
    inputValue,
    calendarPosition,
    goToPreviousMonth,
    goToNextMonth,
    onYearChange,
    onMonthChange,
    editDateSelect = true,
    datePosition = "bottom",
  } = props;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);

  // 년도 옵션 생성 (현재 년도 기준 ±50년)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 25; i <= currentYear + 20; i++) {
    yearOptions.push({ value: i.toString(), label: `${i}년` });
  }

  // 월 옵션 생성
  const monthOptions = [];
  for (let i = 1; i <= 12; i++) {
    monthOptions.push({ value: i.toString(), label: `${i}월` });
  }
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  // 현재 월의 마지막 날짜가 포함된 주의 일요일까지 계산
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  // 시작일부터 종료일까지의 일수 계산
  const totalDays =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  const days = [];
  const currentDateFormatted = formatDate(new Date());
  const selectedDate = range ? null : inputValue;

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const dateFormatted = formatDate(date);
    const isToday = dateFormatted === currentDateFormatted;
    const isSelected = dateFormatted === selectedDate;
    const isInRange = isDateInRange(date, range, rangeStart, rangeEnd);
    const isRangeStart = range && dateFormatted === rangeStart;
    const isRangeEnd = range && dateFormatted === rangeEnd;

    // 현재 월인지 확인
    const isCurrentMonth = date.getMonth() === month;
    const rangeStartDate = new Date(rangeStart);

    rangeStartDate.setDate(rangeStartDate.getDate() - 1);
    // 종료 날짜 선택 시 시작 날짜보다 이전 날짜는 비활성화
    const isDisabled =
      range && isSelectingEnd && rangeStart && date < rangeStartDate;

    days.push(
      <button
        key={i}
        onClick={() => handleDateSelect(date)}
        disabled={isDisabled || false}
        className={`
                w-8 h-8 text-sm flex items-center justify-center rounded-2xl transition-colors
                ${!isCurrentMonth ? "text-gray-300" : ""}
                ${isToday ? "bg-gray-100 " : ""}
                ${isInRange && !isToday ? "bg-gray-100/90" : ""}
                ${isSelected && !isToday ? "bg-neutral-200 text-gray-700" : ""}
                ${(isRangeStart || isRangeEnd) && !isToday ? "bg-neutral-300 text-gray-700 opacity-100" : ""}
                ${isDisabled ? "opacity-20 cursor-not-allowed" : "hover:bg-blue-100 cursor-pointer"}
                `}
      >
        {date.getDate()}
      </button>,
    );
  }

  const calendarPositionClass =
    range && calendarPosition === "end" ? "right-0" : "left-0";

  const datePositionClass =
    datePosition === "top" ? "bottom-full mb-1" : "top-full mt-1";

  return (
    <div
      className={`${datePositionClass} ${calendarPositionClass} bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-[280px]`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-gray-100 rounded cursor-pointer"
        >
          <ChevronLeft className="size-4 text-balck" />
        </button>

        {editDateSelect ? (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Select
                value={year.toString()}
                options={yearOptions}
                onValueChange={(value) => onYearChange(parseInt(value))}
                className="w-20 cursor-pointer"
              />
            </div>
            <div
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Select
                value={(month + 1).toString()}
                options={monthOptions}
                onValueChange={(value) => onMonthChange(parseInt(value) - 1)}
                className="w-20 cursor-pointer"
              />
            </div>
          </div>
        ) : (
          <h3 className="text-lg font-semibold">
            {year}년 {month + 1}월
          </h3>
        )}

        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-gray-100 rounded cursor-pointer"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2 "
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">{days}</div>

      {range && (
        <div className="mt-3 text-sm text-gray-600">
          <p className="text-center">
            {isSelectingEnd
              ? "종료 날짜를 선택하세요"
              : "시작 날짜를 선택하세요"}
          </p>
        </div>
      )}
    </div>
  );
};
