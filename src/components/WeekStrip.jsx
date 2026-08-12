const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// dotState: 'today' | 'cooked' | 'planned' | 'empty'
function getDotStyle(state) {
  if (state === 'today') return 'w-[18px] h-[18px] rounded-full bg-[#1A2E1A]'
  if (state === 'cooked') return 'w-2.5 h-2.5 rounded-full bg-[#E8611A]'
  if (state === 'planned') return 'w-2.5 h-2.5 rounded-full border-2 border-[#E8611A]'
  return 'w-2.5 h-2.5 rounded-full bg-[#1A2E1A]/15'
}

export default function WeekStrip({ weekDates = [], mealPlanDates = [], cookedDates = [], today, onDayClick, summary }) {
  return (
    <div>
      <div className="flex justify-between">
        {weekDates.map((date, i) => {
          const isToday = date === today
          const hasCooked = cookedDates.includes(date)
          const hasPlanned = mealPlanDates.includes(date)
          const dotState = isToday ? 'today' : hasCooked ? 'cooked' : hasPlanned ? 'planned' : 'empty'
          return (
            <button
              key={date}
              onClick={() => onDayClick?.(date)}
              className="flex flex-col items-center gap-1.5"
            >
              <span className="text-[10.5px] font-semibold text-[#6B5B4E]">{DAY_LABELS[i]}</span>
              <span className={`text-[12px] font-bold text-[#1A2E1A]`}>
                {new Date(date + 'T00:00:00').getDate()}
              </span>
              <span className={getDotStyle(dotState)} />
            </button>
          )
        })}
      </div>
      {summary && (
        <p className="mt-3 text-[12.5px] font-medium text-[#6B5B4E]">{summary}</p>
      )}
    </div>
  )
}
