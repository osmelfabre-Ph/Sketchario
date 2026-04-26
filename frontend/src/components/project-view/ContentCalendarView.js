import { CaretLeft, CaretRight, CheckCircle, Video, Image } from '@phosphor-icons/react';
import { richTextToPlainText } from '../../lib/utils';
import { MONTH_IT } from './constants';

export default function ContentCalendarView({
  contents,
  queueItems,
  calYear,
  calMonth,
  setCalYear,
  setCalMonth,
  days,
  handleDrop,
  setDragContent,
  openContentDetail,
}) {
  const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
  const today = new Date();

  return (
    <div className="calendar-container mt-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          className="btn-ghost py-1 px-2 text-sm flex items-center gap-1"
          onClick={() => { const d = new Date(calYear, calMonth - 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
        >
          <CaretLeft size={14} />
        </button>
        <span className="font-semibold text-sm">{MONTH_IT[calMonth]} {calYear}</span>
        <button
          className="btn-ghost py-1 px-2 text-sm flex items-center gap-1"
          onClick={() => { const d = new Date(calYear, calMonth + 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }}
        >
          <CaretRight size={14} />
        </button>
      </div>
      <div className="calendar-grid">
        {days.map(day => <div key={day} className="calendar-header">{day}</div>)}
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i - firstDow + 1;
          const isMonth = dayNum >= 1 && dayNum <= daysInMonth;
          const isToday = isMonth && dayNum === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
          const dayContents = isMonth ? contents.filter(c => {
            const q = queueItems.find(qi => qi.content_id === c.id && (qi.status === 'queued' || qi.status === 'published'));
            if (!q?.scheduled_at) return false;
            const date = new Date(q.scheduled_at);
            return date.getFullYear() === calYear && date.getMonth() === calMonth && date.getDate() === dayNum;
          }) : [];
          return (
            <div
              key={i}
              className={`calendar-cell ${!isMonth ? 'opacity-20' : ''}`}
              style={isToday ? { background: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.4)' } : {}}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; }}
              onDragLeave={e => { e.currentTarget.style.background = isToday ? 'rgba(99,102,241,0.08)' : ''; }}
              onDrop={e => { e.currentTarget.style.background = ''; handleDrop(dayNum - 1, e); }}
            >
              {isMonth && (
                <>
                  <span className="text-xs font-medium" style={{ color: isToday ? 'var(--accent-purple)' : 'var(--text-secondary)', fontWeight: isToday ? 700 : 500 }}>{dayNum}</span>
                  {dayContents.map(c => (
                    <div
                      key={c.id}
                      className={`content-chip ${c.status === 'published' ? 'published' : c.format}`}
                      draggable
                      onDragStart={() => setDragContent(c)}
                      onClick={() => openContentDetail(c)}
                    >
                      {c.status === 'published' ? <CheckCircle size={10} weight="fill" /> : c.format === 'reel' ? <Video size={10} /> : <Image size={10} />}
                      <span className="ml-1 truncate">{(c.hook_text || richTextToPlainText(c.caption || '') || '').slice(0, 20)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
