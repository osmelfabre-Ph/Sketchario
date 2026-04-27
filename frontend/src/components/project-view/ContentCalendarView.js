import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { richTextToPlainText } from '../../lib/utils';
import { PLATFORM_ICONS } from './constants';

const getLocaleTag = (lang) => {
  const base = String(lang || '').toLowerCase();
  if (base.startsWith('it')) return 'it-IT';
  if (base.startsWith('en')) return 'en-US';
  if (base.startsWith('es')) return 'es-ES';
  if (base.startsWith('fr')) return 'fr-FR';
  return lang || 'it-IT';
};

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date) {
  const base = startOfDay(date);
  const dayIndex = (base.getDay() + 6) % 7;
  return addDays(base, -dayIndex);
}

function endOfWeek(date) {
  return addDays(startOfWeek(date), 6);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatTime(date, locale) {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function getEventTitle(content, fallback) {
  return content?.hook_text || richTextToPlainText(content?.caption || '').slice(0, 90) || fallback;
}

function buildCalendarEvents(contents, queueItems, locale, fallbackTitle) {
  const contentMap = Object.fromEntries((contents || []).map(content => [content.id, content]));
  const grouped = {};

  (queueItems || []).forEach(item => {
    if (!['queued', 'processing', 'published'].includes(String(item.status || ''))) return;
    if (!item.scheduled_at || !item.content_id) return;

    const scheduledAt = new Date(item.scheduled_at);
    if (Number.isNaN(scheduledAt.getTime())) return;

    const content = contentMap[item.content_id];
    if (!content) return;

    const groupKey = `${item.content_id}__${scheduledAt.toISOString()}`;
    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        id: groupKey,
        content,
        scheduledAt,
        dateKey: dateKey(scheduledAt),
        timeLabel: formatTime(scheduledAt, locale),
        title: getEventTitle(content, fallbackTitle),
        platforms: [],
        statuses: [],
      };
    }

    if (item.platform && !grouped[groupKey].platforms.includes(item.platform)) {
      grouped[groupKey].platforms.push(item.platform);
    }
    if (item.status && !grouped[groupKey].statuses.includes(item.status)) {
      grouped[groupKey].statuses.push(item.status);
    }
  });

  return Object.values(grouped).sort((a, b) => a.scheduledAt - b.scheduledAt);
}

function getStatusAccent(event) {
  if (event.statuses.includes('published')) return 'rgba(34,197,94,0.8)';
  if (event.statuses.includes('processing')) return 'rgba(249,115,22,0.8)';
  if (event.content?.format === 'reel') return 'rgba(236,72,153,0.8)';
  if (event.content?.format === 'prompted_reel') return 'rgba(168,85,247,0.8)';
  return 'rgba(99,102,241,0.8)';
}

function PlatformDots({ platforms }) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {platforms.map(platform => (
        <span
          key={platform}
          title={PLATFORM_ICONS[platform]?.name || platform}
          className="w-2 h-2 rounded-full"
          style={{ background: PLATFORM_ICONS[platform]?.color || '#9ca3af' }}
        />
      ))}
    </div>
  );
}

function CalendarEventRow({ event, compact = false, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(event.content)}
      className="w-full text-left rounded-md px-2 py-1.5 transition-colors hover:brightness-110"
      style={{
        background: 'rgba(255,255,255,0.04)',
        borderLeft: `3px solid ${getStatusAccent(event)}`,
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-semibold mt-0.5 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
          {event.timeLabel}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium leading-snug`}
            style={{ color: 'var(--text-primary)' }}
          >
            {event.title}
          </p>
        </div>
        <PlatformDots platforms={event.platforms} />
      </div>
    </button>
  );
}

function MonthView({ focusDate, events, onOpen, onPickDate, weekdayShort, t }) {
  const monthStart = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const monthEnd = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 0);
  const firstGrid = startOfWeek(monthStart);
  const lastGrid = endOfWeek(monthEnd);
  const today = startOfDay(new Date());

  const eventsByDay = {};
  events.forEach(event => {
    if (!eventsByDay[event.dateKey]) eventsByDay[event.dateKey] = [];
    eventsByDay[event.dateKey].push(event);
  });

  const cells = [];
  for (let cursor = new Date(firstGrid); cursor <= lastGrid; cursor = addDays(cursor, 1)) {
    cells.push(new Date(cursor));
  }

  return (
    <>
      <div className="calendar-grid">
        {weekdayShort.map(day => <div key={day} className="calendar-header">{day}</div>)}
        {cells.map(date => {
          const key = dateKey(date);
          const dayEvents = eventsByDay[key] || [];
          const isCurrentMonth = date.getMonth() === focusDate.getMonth();
          const isToday = sameDay(date, today);
          return (
            <div
              key={key}
              className="calendar-cell"
              onClick={() => onPickDate(date)}
              style={{
                opacity: isCurrentMonth ? 1 : 0.45,
                background: isToday ? 'rgba(99,102,241,0.08)' : dayEvents.length ? 'rgba(255,255,255,0.02)' : undefined,
                borderColor: isToday ? 'rgba(99,102,241,0.4)' : undefined,
                cursor: 'pointer',
              }}
            >
              <span className="text-xs font-medium" style={{ color: isToday ? 'var(--accent-purple)' : 'var(--text-secondary)', fontWeight: isToday ? 700 : 500 }}>
                {date.getDate()}
              </span>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 4).map(event => (
                  <CalendarEventRow key={event.id} event={event} compact onOpen={onOpen} />
                ))}
                {dayEvents.length > 4 && (
                  <p className="text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>
                    {t('project.calendar.moreOther', { count: dayEvents.length - 4 })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function WeekView({ focusDate, events, onOpen, onPickDate, locale, t }) {
  const start = startOfWeek(focusDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const today = startOfDay(new Date());

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-3">
      {days.map(day => {
        const key = dateKey(day);
        const dayEvents = events.filter(event => event.dateKey === key);
        const isToday = sameDay(day, today);
        return (
          <div
            key={key}
            className="rounded-xl p-3 min-h-[260px]"
            style={{
              background: isToday ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isToday ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`,
            }}
          >
            <button type="button" className="w-full text-left mb-3" onClick={() => onPickDate(day, 'day')}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {day.toLocaleDateString(locale, { weekday: 'short' })}
              </p>
              <p className="font-semibold text-sm">{day.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}</p>
            </button>
            <div className="space-y-2">
              {dayEvents.length ? dayEvents.map(event => (
                <CalendarEventRow key={event.id} event={event} onOpen={onOpen} />
              )) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('project.calendar.empty')}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ focusDate, events, onOpen, locale, t }) {
  const key = dateKey(focusDate);
  const dayEvents = events.filter(event => event.dateKey === key);

  if (!dayEvents.length) {
    return (
      <div className="rounded-xl p-6 mt-3 text-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
        {t('project.calendar.emptyDay')}
      </div>
    );
  }

  const eventHours = dayEvents.map(event => event.scheduledAt.getHours());
  const startHour = Math.min(7, ...eventHours);
  const endHour = Math.max(22, ...eventHours);
  const rows = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    const slotEvents = dayEvents.filter(event => event.scheduledAt.getHours() === hour);
    rows.push({ hour, slotEvents });
  }

  return (
    <div className="rounded-xl overflow-hidden mt-3" style={{ border: '1px solid var(--border-color)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-color)', background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-sm font-semibold">
          {focusDate.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div>
        {rows.map(row => (
          <div key={row.hour} className="grid grid-cols-[72px_1fr] min-h-[64px] border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
            <div className="px-3 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)' }}>
              {String(row.hour).padStart(2, '0')}:00
            </div>
            <div className="p-2 space-y-2">
              {row.slotEvents.length ? row.slotEvents.map(event => (
                <CalendarEventRow key={event.id} event={event} onOpen={onOpen} />
              )) : (
                <div className="h-full min-h-[40px] rounded-md" style={{ background: 'rgba(255,255,255,0.015)' }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContentCalendarView({
  contents,
  queueItems,
  calYear,
  calMonth,
  setCalYear,
  setCalMonth,
  openContentDetail,
}) {
  const { t, i18n } = useTranslation();
  const locale = getLocaleTag(i18n.language);
  const weekdayShort = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + index))
  );
  const viewModes = [
    { id: 'month', label: t('project.calendar.month') },
    { id: 'week', label: t('project.calendar.week') },
    { id: 'day', label: t('project.calendar.day') },
  ];
  const [viewMode, setViewMode] = useState('month');
  const [focusDate, setFocusDate] = useState(new Date(calYear, calMonth, 1));

  useEffect(() => {
    const next = new Date(focusDate);
    next.setFullYear(calYear, calMonth, 1);
    if (next.getFullYear() !== focusDate.getFullYear() || next.getMonth() !== focusDate.getMonth()) {
      setFocusDate(next);
    }
  }, [calYear, calMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCalYear(focusDate.getFullYear());
    setCalMonth(focusDate.getMonth());
  }, [focusDate, setCalMonth, setCalYear]);

  const events = buildCalendarEvents(contents, queueItems, locale, t('project.calendar.defaultTitle'));

  const navigate = (direction) => {
    setFocusDate(prev => {
      if (viewMode === 'day') return addDays(prev, direction);
      if (viewMode === 'week') return addDays(prev, direction * 7);
      return new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
    });
  };

  const getHeaderLabel = () => {
    if (viewMode === 'day') {
      return focusDate.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const start = startOfWeek(focusDate);
      const end = endOfWeek(focusDate);
      return `${start.toLocaleDateString(locale, { day: '2-digit', month: 'short' })} → ${end.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    return `${focusDate.toLocaleDateString(locale, { month: 'long' })} ${focusDate.getFullYear()}`;
  };

  const handlePickDate = (date, nextView = null) => {
    setFocusDate(startOfDay(date));
    if (nextView) setViewMode(nextView);
  };

  return (
    <div className="calendar-container mt-2">
      <div className="flex flex-col gap-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          <button className="btn-ghost py-1 px-2 text-sm flex items-center gap-1" onClick={() => navigate(-1)}>
            <CaretLeft size={14} />
          </button>
          <span className="font-semibold text-sm text-center">{getHeaderLabel()}</span>
          <button className="btn-ghost py-1 px-2 text-sm flex items-center gap-1" onClick={() => navigate(1)}>
            <CaretRight size={14} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          {viewModes.map(mode => (
            <button
              key={mode.id}
              type="button"
              className={`preset-btn text-xs ${viewMode === mode.id ? 'active' : ''}`}
              onClick={() => setViewMode(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && (
        <MonthView
          focusDate={focusDate}
          events={events}
          onOpen={openContentDetail}
          onPickDate={(date) => handlePickDate(date)}
          weekdayShort={weekdayShort}
          t={t}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          focusDate={focusDate}
          events={events}
          onOpen={openContentDetail}
          onPickDate={handlePickDate}
          locale={locale}
          t={t}
        />
      )}

      {viewMode === 'day' && (
        <DayView
          focusDate={focusDate}
          events={events}
          onOpen={openContentDetail}
          locale={locale}
          t={t}
        />
      )}
    </div>
  );
}
