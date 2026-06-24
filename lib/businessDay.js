const BUSINESS_TZ_OFFSET_HOURS = 8; // Philippines/Singapore time, UTC+8

function pad(value) {
  return String(value).padStart(2, '0');
}

export function businessDateString(date = new Date()) {
  const shifted = new Date(date.getTime() + BUSINESS_TZ_OFFSET_HOURS * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function businessDayRange(dateString = businessDateString()) {
  const [year, month, day] = String(dateString).split('-').map(Number);
  if (!year || !month || !day) throw new Error('Invalid business date. Use YYYY-MM-DD.');
  const startUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - BUSINESS_TZ_OFFSET_HOURS * 60 * 60 * 1000;
  const endUtcMs = Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - BUSINESS_TZ_OFFSET_HOURS * 60 * 60 * 1000;
  return {
    businessDate: `${year}-${pad(month)}-${pad(day)}`,
    start: new Date(startUtcMs),
    end: new Date(endUtcMs)
  };
}

export function closingNo(dateString = businessDateString()) {
  const cleanDate = dateString.replace(/-/g, '');
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(8, 14);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CLOSE-${cleanDate}-${stamp}-${rand}`;
}
