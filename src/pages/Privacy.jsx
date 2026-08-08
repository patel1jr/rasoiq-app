import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-[#FDF6EC] px-6 pt-12 pb-16">
      <button
        onClick={() => navigate(-1)}
        className="w-9 h-9 rounded-full bg-white border border-[#EDE8E0] flex items-center justify-center mb-8"
      >
        <ArrowLeft size={17} className="text-[#5A6B5A]" />
      </button>

      <span className="font-display text-2xl font-bold text-[#1A2E1A]">
        raso<span className="text-[#E8611A]">IQ</span>
      </span>

      <h1 className="font-display text-xl font-bold text-[#1A2E1A] mt-6 mb-1">Privacy Policy</h1>
      <p className="text-xs text-[#9B9490] mb-8">Last updated: August 2026</p>

      <div className="flex flex-col gap-7 text-[15px] leading-relaxed text-[#3D4D3D]">

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">What we collect</h2>
          <p>
            When you create an account or sign in with Google, we collect your email address
            and name. If you sign up with email and password, we store your email and a
            securely hashed version of your password.
          </p>
          <p className="mt-2">
            We also store the recipes you extract and save, your meal logs, and preferences
            you set within the app.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">How we use it</h2>
          <p>
            Your data is used solely to provide the rasoIQ service — personalising your
            recipe library, meal history, and meal planning. We do not sell your data to
            third parties, and we do not use it for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Third-party services</h2>
          <p>
            We use Supabase to manage authentication and data storage. YouTube video links
            are processed to extract recipe information; we do not store video content.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Data retention</h2>
          <p>
            Your data is retained for as long as your account is active. You may request
            deletion of your account and all associated data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Contact</h2>
          <p>
            Questions about this policy?{' '}
            <a href="mailto:hello@rasoiq.app" className="text-[#E8611A] font-medium underline underline-offset-2">
              hello@rasoiq.app
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
