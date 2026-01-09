import dayjs from "dayjs";

export const formatDate = (date: string, time: boolean = false) => {
  return dayjs(date).format(time ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD");
};

export const todayDate = () => {
  return dayjs().format("YYYY-MM-DD");
};

export const chatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return dayjs(date).format("HH:MM");
};

export const chatFullTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return dayjs(date).format("YYYY-MM-DD HH:MM");
};
