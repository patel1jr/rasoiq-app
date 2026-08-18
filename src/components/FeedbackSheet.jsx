import { useState } from 'react'
import { X, MessageSquare } from 'lucide-react'
import { submitFeedback } from '../lib/api'

export default function FeedbackSheet({ type, sourceUrl, options, onClose }) {
  const [selected, setSelected]   = useState([])
  const [comment, setComment]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(false)

  function toggle(label) {
    setSelected(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await submitFeedback({
        type,
        url: sourceUrl || undefined,
        reasons: selected,
        comment: comment.trim() || undefined,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      })
    } catch { /* best-effort */ }
    setDone(true)
    setTimeout(onClose, 2000)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-5 pt-5 pb-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FEF0E8] flex items-center justify-center">
              <MessageSquare size={16} className="text-[#E8611A]" />
            </div>
            <h3 className="text-[17px] font-bold text-[#1A2E1A]">What went wrong?</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0EBE4] flex items-center justify-center"
          >
            <X size={15} className="text-[#5A6B5A]" />
          </button>
        </div>

        {done ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">🙏</span>
            <p className="text-[15px] font-semibold text-[#1A2E1A]">Thanks! We'll look into this</p>
          </div>
        ) : (
          <>
            {/* Quick options */}
            <div className="flex flex-wrap gap-2 mb-4">
              {options.map(label => (
                <button
                  key={label}
                  onClick={() => toggle(label)}
                  className="px-3.5 py-2 rounded-full text-[13px] font-semibold border transition-colors"
                  style={selected.includes(label) ? {
                    background: '#E8611A',
                    color: '#fff',
                    borderColor: '#E8611A',
                  } : {
                    background: '#FAF3E7',
                    color: '#1A2E1A',
                    borderColor: 'rgba(26,46,26,0.12)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Free text */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us more..."
              rows={3}
              className="w-full rounded-2xl bg-[#FAF3E7] border border-[#1A2E1A]/10 px-4 py-3 text-[13.5px] text-[#1A2E1A] placeholder:text-[#1A2E1A]/40 outline-none resize-none mb-4"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || (selected.length === 0 && !comment.trim())}
              className="w-full h-[50px] rounded-[25px] text-white text-[15px] font-bold disabled:opacity-50 transition-opacity"
              style={{ background: '#E8611A', boxShadow: '0 8px 18px -8px rgba(232,97,26,.65)' }}
            >
              {submitting ? 'Sending…' : 'Send feedback'}
            </button>
          </>
        )}
      </div>
    </>
  )
}
