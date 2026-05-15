import { getCurrentKstWeekStart } from "./kst";

export function getCurrentWeekStart(date = new Date()) {
  return getCurrentKstWeekStart(date);
}
