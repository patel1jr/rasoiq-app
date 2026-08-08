import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Bookmark, Plus, User } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/saved', icon: Bookmark, label: 'Saved' },
  { path: '/log', icon: Plus, label: 'Log' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#EDE8E0] flex h-[72px] z-30">
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path
        const isLog = label === 'Log'
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            {isLog ? (
              <div className="w-10 h-10 rounded-full bg-[#E8611A] flex items-center justify-center -mt-1">
                <Icon size={20} className="text-white" strokeWidth={2.5} />
              </div>
            ) : (
              <Icon
                size={22}
                className={active ? 'text-[#E8611A]' : 'text-[#C0B8AF]'}
                strokeWidth={active ? 2.2 : 1.8}
              />
            )}
            <span className={`text-[10px] font-semibold ${active || isLog ? 'text-[#E8611A]' : 'text-[#C0B8AF]'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
