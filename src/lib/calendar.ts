import adbs from 'ad-bs-converter';
import { format } from 'date-fns';

export type CalendarType = 'AD' | 'BS';

export const adToBs = (date: Date): string => {
  try {
    const formattedDate = format(date, 'yyyy/MM/dd');
    const result = adbs.ad2bs(formattedDate);
    return `${result.en.year}-${result.en.month}-${result.en.day}`;
  } catch (e) {
    return 'Invalid Date';
  }
};

export const bsToAd = (bsDate: string): Date => {
  try {
    const [year, month, day] = bsDate.split('-').map(Number);
    const result = adbs.bs2ad(`${year}/${month}/${day}`);
    return new Date(result.year, result.month - 1, result.day);
  } catch (e) {
    return new Date();
  }
};

export const NEPALI_MONTHS = [
  'Baishak', 'Jhestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

export const NEPALI_WEEKDAYS = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
];

export const getBsMonthName = (date: Date): string => {
  try {
    const formattedDate = format(date, 'yyyy/MM/dd');
    const result = adbs.ad2bs(formattedDate);
    return NEPALI_MONTHS[result.en.month - 1];
  } catch (e) {
    return '';
  }
};

export const formatDisplayDate = (date: Date, type: CalendarType): string => {
  const ad = format(date, 'MMM d, yyyy');
  if (type === 'BS') {
    const bs = adToBs(date);
    const [y, m, d] = bs.split('-');
    return `${NEPALI_MONTHS[parseInt(m) - 1]} ${d}, ${y} BS`;
  }
  return ad;
};

export const formatFullDate = (date: Date, preference: CalendarType = 'AD'): string => {
  const ad = format(date, 'MMM d, yyyy');
  const bsRaw = adToBs(date);
  const [y, m, d] = bsRaw.split('-');
  const bs = `${NEPALI_MONTHS[parseInt(m) - 1]} ${d}, ${y} BS`;
  
  if (preference === 'BS') {
    return `${bs} (${ad})`;
  }
  return `${ad} / ${bs}`;
};
