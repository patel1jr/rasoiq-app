import { useLocation, useNavigate } from 'react-router-dom'
import { Home, History, ChefHat, BookOpen, User } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/extract', icon: ChefHat, label: 'Cook' },
  { path: '/saved', icon: BookOpen, label: 'Saved' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#EDE8E0] flex h-[72px] z-30">
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center justify-center gap-1"
          >
            <Icon
              size={22}
              className={active ? 'text-[#E8611A]' : 'text-[#C0B8AF]'}
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span className={`text-[10px] font-semibold ${active ? 'text-[#E8611A]' : 'text-[#C0B8AF]'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
