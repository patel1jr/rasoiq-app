import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Compass, Bookmark, User } from 'lucide-react'

function FireIcon({ size = 22, active }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C12 2 7 7.5 7 13a5 5 0 0010 0c0-2.5-1.5-5-2.5-6.5C14.5 8 15 9.5 15 11c0 1.5-.5 2.5-1.5 3C14 12 13.5 9 12 2z"
        fill={active ? '#E8611A' : 'none'}
        stroke={active ? '#E8611A' : '#C0B8AF'}
        strokeWidth={active ? 0 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const NAV_ITEMS = [
  { path: '/',          icon: Home,    label: 'Home'      },
  { path: '/discover',  icon: Compass, label: 'Discover'  },
  { path: '/trending',  icon: null,    label: 'Trending'  },
  { path: '/saved',     icon: Bookmark,label: 'Saved'     },
  { path: '/profile',   icon: User,    label: 'Profile'   },
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
            {label === 'Trending' ? (
              <span className={`text-[22px] leading-none ${active ? 'opacity-100' : 'opacity-40'}`}>🔥</span>
            ) : (
              <Icon
                size={22}
                className={active ? 'text-[#E8611A]' : 'text-[#C0B8AF]'}
                strokeWidth={active ? 2.2 : 1.8}
              />
            )}
            <span className={`text-[10px] font-semibold ${active ? 'text-[#E8611A]' : 'text-[#C0B8AF]'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
