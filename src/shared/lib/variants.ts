import { cva } from "class-variance-authority";
import clsx from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium rounded-sm transition-colors cursor-pointer focus:outline-none  disabled:pointer-events-none",
  {
    variants: {
      variant: {
        outline:
          "bg-white border border-gray-300 hover:bg-gray-100 hover:text-black px-4 py-1",
        save: "bg-[#2B7FFF] text-white disabled:bg-[#EDEEF9] disabled:text-[#B0B4D8] px-5 py-1 font-gmarket font-bold",
        edit: "bg-white border border-[#BEBEBE] border-dashed text-[#838383] px-5 py-1 font-gmarket",
        delete:
          "bg-white border border-[#FF6467] text-[#FF6467] px-5 py-1 disabled:bg-[#F5F7F9] disabled:border-[#E8EEF2] disabled:text-[#C7D0D7] font-bold font-gmarket",
        reset:
          "bg-[#F8F8F8] border border-[#C7C7C7] text-[#737373] px-4 py-1 font-gmarket font-bold",
        search: "bg-[#4D48FC] text-white px-4 py-1 font-gmarket font-bold",
        file: "bg-[#5c6069] text-white px-4 py-1 font-gmarket",
        pagination:
          "px-5 py-1 bg-white hover:bg-neutral-200/75 active:bg-neutral-300  rounded-sm disabled:opacity-50 disabled:pointer-events-none",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

export const textVariants = cva(
  "leading-tight break-all", // 기본 텍스트 속성
  {
    variants: {
      variant: {
        default: "text-gray-900",
        muted: "text-gray-500",
        danger: "text-red-600",
        success: "text-green-600",
        info: "text-blue-600",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
        "4xl": "text-4xl",
        "5xl": "text-5xl",
        "6xl": "text-6xl",
        "7xl": "text-7xl",
        "8xl": "text-8xl",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      color: {
        main: "text-main",
        lightGray: "text-light-gray",
        basicGray: "text-basic-gray",
        darkGray: "text-dark-gray",
        white: "text-white",
        black: "text-black",
        gray: "text-gray-500",
        brown: "text-amber-700",
        orange: "text-orange-500",
        yellow: "text-yellow-500",
        green: "text-green-500",
        blue: "text-blue-500",
        purple: "text-purple-500",
        pink: "text-pink-500",
        red: "text-red-500",
        inherit: "text-inherit",
        default: "text-inherit",
      },
      textLine: {
        underline: "underline decoration-solid",
        strikethrough: "line-through",
      },

      textStyle: {
        italic: "italic",
        noTitalic: "not-italic",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      weight: "normal",
    },
  },
);

export const inputVariants = cva(
  "border border-gray-300 rounded-sm bg-white text-gray-900 px-2 py-0.75 focus:outline-none transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      fullWidth: {
        true: "w-full",
        false: "",
      },
      flip: {
        true: "border-transparent bg-transparent focus:border-transparent",
        false: "",
      },
    },
    defaultVariants: {
      fullWidth: false,
    },
  },
);
