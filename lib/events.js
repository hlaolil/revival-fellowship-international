// Turns stored events into dated occurrences. Events are either:
//  - one-off:   { date: 'YYYY-MM-DD' }
//  - monthly:   { repeat: 'monthly', nth: 1-4 or -1 (last), weekday: 0-6 (Sun-Sat), date: start, until?: end }
//  - free text: { date: 'Every Sunday' } – shown as regular gatherings, never expanded

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDINALS = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', '-1': 'Last' };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const toIso = d => d.toISOString().slice(0, 10);

function isMonthly(e) {
  return e.repeat === 'monthly' && ISO_DATE.test(e.date || '') && Number.isInteger(+e.weekday) && ORDINALS[e.nth] !== undefined;
}

function isOneOff(e) {
  return !isMonthly(e) && ISO_DATE.test(e.date || '') && !isNaN(new Date(e.date));
}

// Date of the nth weekday in a month (UTC), or null if it doesn't exist
function nthWeekday(year, month, weekday, nth) {
  if (+nth === -1) {
    const last = new Date(Date.UTC(year, month + 1, 0));
    last.setUTCDate(last.getUTCDate() - ((last.getUTCDay() - weekday + 7) % 7));
    return last;
  }
  const first = new Date(Date.UTC(year, month, 1));
  const day = 1 + ((weekday - first.getUTCDay() + 7) % 7) + (nth - 1) * 7;
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCMonth() === month ? date : null;
}

// All dated occurrences between from and to (ISO strings, inclusive), sorted by date
function expandEvents(events, from, to) {
  const out = [];
  for (const e of events) {
    if (isOneOff(e)) {
      if (e.date >= from && e.date <= to) out.push(e);
    } else if (isMonthly(e)) {
      const end = e.until && ISO_DATE.test(e.until) && e.until < to ? e.until : to;
      const start = e.date > from ? e.date : from;
      let year = +start.slice(0, 4), month = +start.slice(5, 7) - 1;
      while (toIso(new Date(Date.UTC(year, month, 1))) <= end) {
        const d = nthWeekday(year, month, +e.weekday, +e.nth);
        if (d) {
          const iso = toIso(d);
          if (iso >= start && iso <= end) out.push({ ...e, date: iso, recurring: true });
        }
        month++;
        if (month > 11) { month = 0; year++; }
      }
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function describeRepeat(e) {
  if (!isMonthly(e)) return e.date;
  let text = `${ORDINALS[e.nth]} ${WEEKDAYS[e.weekday]} of every month`;
  if (e.until) text += ` until ${new Date(e.until).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  return text;
}

function todayIso() {
  return toIso(new Date());
}

function addMonthsIso(months) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + months);
  return toIso(d);
}

module.exports = { WEEKDAYS, ORDINALS, isMonthly, isOneOff, expandEvents, describeRepeat, todayIso, addMonthsIso };
