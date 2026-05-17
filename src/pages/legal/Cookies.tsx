import LegalLayout from './LegalLayout'
import { PRODUCT_NAME } from '../../lib/constants'

export default function Cookies() {
  return (
    <LegalLayout title="Cookie Notice" updated="17 May 2026">
      <p>
        {PRODUCT_NAME} uses browser local storage to remember your session, theme preference,
        and graph settings. We do not set third-party advertising cookies in this demo.
      </p>
      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
        What we store locally
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Authentication state (demo user)</li>
        <li>Theme (light / dark)</li>
        <li>Graph control panel preferences</li>
      </ul>
      <p className="mt-4">
        You can clear site data via your browser settings at any time.
      </p>
    </LegalLayout>
  )
}
