import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
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

      <h1 className="font-display text-xl font-bold text-[#1A2E1A] mt-6 mb-1">Terms of Service</h1>
      <p className="text-xs text-[#9B9490] mb-8">Last updated: August 2026</p>

      <div className="flex flex-col gap-7 text-[15px] leading-relaxed text-[#3D4D3D]">

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Using rasoIQ</h2>
          <p>
            By using rasoIQ you agree to these terms. The service is intended for personal,
            non-commercial use — discovering, saving, and planning Indian meals for yourself
            and your household.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 flex flex-col gap-1.5 pl-4 list-disc marker:text-[#E8611A]">
            <li>Attempt to scrape, automate, or abuse the extraction service at scale</li>
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to reverse-engineer or interfere with the platform</li>
            <li>Share your account credentials with others</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Service provided as-is</h2>
          <p>
            rasoIQ is provided as-is without warranties of any kind. Recipe extraction
            depends on third-party video content and AI processing — results may occasionally
            be incomplete or inaccurate. We are not liable for any decisions made based on
            extracted content.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Intellectual property</h2>
          <p>
            Recipe content extracted from YouTube videos belongs to the respective creators.
            rasoIQ does not claim ownership over extracted recipes. The rasoIQ name, logo,
            and app design are our property.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service after
            changes are posted means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1A2E1A] mb-2">Contact</h2>
          <p>
            Questions about these terms?{' '}
            <a href="mailto:hello@rasoiq.app" className="text-[#E8611A] font-medium underline underline-offset-2">
              hello@rasoiq.app
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
