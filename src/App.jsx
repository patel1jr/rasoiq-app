import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ExtractPage from './pages/ExtractPage'
import RecipePage from './pages/RecipePage'
import CookMode from './pages/CookMode'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import SavedRecipes from './pages/SavedRecipes'
import QuickLog from './pages/QuickLog'
import History from './pages/History'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import BottomNav from './components/BottomNav'

const HIDE_NAV = ['/recipe', '/cook', '/auth', '/log']

function App() {
  const location = useLocation()
  const showNav = !HIDE_NAV.some(p => location.pathname.startsWith(p))

  return (
    <div className="min-h-screen bg-[#FDF6EC] max-w-md mx-auto relative overflow-x-hidden">
      <Routes>
        <Route path="/" element={<ExtractPage />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/extract" element={<ExtractPage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/recipe" element={<RecipePage />} />
        <Route path="/cook/:id" element={<CookMode />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/saved" element={<SavedRecipes />} />
        <Route path="/log" element={<QuickLog />} />
        <Route path="/history" element={<History />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  )
}

export default App
