const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function WeekStrip({ weekDates = [], plannedDates = [], today, onDayClick }) {
  return (
    <div className="flex gap-1 justify-between px-1">
      {weekDates.map((date, i) => {
        const isToday = date === today
        const hasPlans = plannedDates.includes(date)
        const isPast = date < today
        return (
          <button
            key={date}
            onClick={() => onDayClick?.(date)}
            className="flex flex-col items-center gap-1.5 flex-1"
          >
            <span className={`text-[10px] font-bold uppercase tracking-wide ${
              isToday ? 'text-[#E8611A]' : isPast ? 'text-[#C0B8AF]' : 'text-[#9B9490]'
            }`}>
              {DAY_LABELS[i]}
            </span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              isToday
                ? 'bg-[#E8611A]'
                : hasPlans
                ? 'bg-[#2D7A5A]/15'
                : 'bg-transparent'
            }`}>
              <span className={`text-[11px] font-semibold ${
                isToday ? 'text-white' : isPast ? 'text-[#C0B8AF]' : 'text-[#1A2E1A]'
              }`}>
                {new Date(date + 'T00:00:00').getDate()}
              </span>
            </div>
            {hasPlans && !isToday && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#2D7A5A]" />
            )}
            {isToday && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8611A]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
