const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

type KstParts = {
  day: number;
  hour: number;
  minute: number;
  month: number;
  weekday: number;
  year: number;
};

function getKstParts(date = new Date()): KstParts {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);

  return {
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    month: shifted.getUTCMonth() + 1,
    weekday: shifted.getUTCDay(),
    year: shifted.getUTCFullYear(),
  };
}

export function getDateFromKst(year: number, month: number, day: number, hour = 0, minute = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0));
}

export function getCurrentKstWeekStart(date = new Date()) {
  const kstDate = getKstParts(date);
  const weekStart = getDateFromKst(kstDate.year, kstDate.month, kstDate.day - kstDate.weekday);
  const shifted = new Date(weekStart.getTime() + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getNextWeeklyMeetingDate(
  meetingDay: number | null,
  meetingTime: string | null,
  now = new Date(),
) {
  if (meetingDay === null || !meetingTime) {
    return null;
  }

  const [hour = 0, minute = 0] = meetingTime.split(":").map(Number);
  const kstNow = getKstParts(now);
  const diff = (meetingDay - kstNow.weekday + 7) % 7;
  let meeting = getDateFromKst(kstNow.year, kstNow.month, kstNow.day + diff, hour, minute);

  if (meeting <= now) {
    meeting = getDateFromKst(kstNow.year, kstNow.month, kstNow.day + diff + 7, hour, minute);
  }

  return meeting;
}

export function getWeeklyMeetingDateForKstWeek(
  weekStart: string,
  meetingDay: number | null,
  meetingTime: string | null,
) {
  if (meetingDay === null || !meetingTime) {
    return null;
  }

  const [year, month, day] = weekStart.split("-").map(Number);
  const [hour = 0, minute = 0] = meetingTime.split(":").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  return getDateFromKst(year, month, day + meetingDay, hour, minute);
}
