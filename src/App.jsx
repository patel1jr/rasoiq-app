import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      <Routes>
        <Route path="/" element={<div className="p-8 text-center text-2xl font-bold text-[#E8611A]">Rasoiq 🍛</div>} />
      </Routes>
    </div>
  )
}

export default App
