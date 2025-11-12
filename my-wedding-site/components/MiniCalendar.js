import { useMemo, useState } from 'react';

const monthNames = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];
const weekdayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function pad(n) { return String(n).padStart(2, '0'); }

export default function MiniCalendar({ initialYear, initialMonth, highlights = [] }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth); // 0-11

  const highlightSet = useMemo(() => new Set(highlights), [highlights]);

  const go = (delta) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  // Build grid with Monday as first day of week
  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startDay = (firstOfMonth.getDay() + 6) % 7; // 0=Mon ... 6=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const arr = [];
    // Leading days from previous month
    for (let i = startDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const date = new Date(year, month - 1, d);
      arr.push({ date, other: true });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ date: new Date(year, month, d), other: false });
    }
    // Trailing days to fill 6 rows x 7 cols (optional)
    while (arr.length % 7 !== 0) {
      const last = arr[arr.length - 1].date;
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      arr.push({ date: next, other: true });
    }
    return arr;
  }, [year, month]);

  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  }, []);

  const isHighlight = (d) => highlightSet.has(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);

  return (
    <div className="calendar" role="group" aria-label="Calendar">
      <div className="calHeader">
        <button type="button" className="calNav" onClick={() => go(-1)} aria-label="Previous month">‹</button>
        <div className="calTitle" aria-live="polite">{monthNames[month]} {year}</div>
        <button type="button" className="calNav" onClick={() => go(1)} aria-label="Next month">›</button>
      </div>
      <div className="calWeek">
        {weekdayNames.map((d) => (<div key={d} className="calWeekday" aria-hidden>{d}</div>))}
      </div>
      <div className="calGrid">
        {cells.map(({ date, other }, i) => {
          const key = `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
          const classes = [
            'calCell',
            other ? 'calOther' : '',
            key === todayKey ? 'calToday' : '',
            isHighlight(date) ? 'calHighlight' : '',
          ].filter(Boolean).join(' ');
          return (
            <button key={key+':'+i} type="button" className={classes} aria-pressed={isHighlight(date)}>
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

