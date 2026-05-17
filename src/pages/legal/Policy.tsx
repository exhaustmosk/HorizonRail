import LegalLayout from './LegalLayout'
import { PRODUCT_NAME } from '../../lib/constants'

export default function Policy() {
  return (
    <LegalLayout title="Privacy Policy" updated="17 May 2026">
      <p>
        {PRODUCT_NAME} (&quot;we&quot;, &quot;our&quot;) respects your privacy. This policy
        describes how we handle information in the demo portal.
      </p>
      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
        Information we collect
      </h2>
      <p>
        In this prototype, data is stored locally in your browser (mock employees, goals,
        and check-ins). No production backend is connected.
      </p>
      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
        How we use information
      </h2>
      <p>
        Goal sheets, quarterly actuals, manager check-in comments, and audit entries are
        used solely to demonstrate performance-management workflows.
      </p>
      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
        Your rights
      </h2>
      <p>
        You may clear browser storage at any time. For a production deployment, your
        organization would provide a full data-subject request process.
      </p>
      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
        Contact
      </h2>
      <p>Privacy inquiries: privacy@horizonrail.app</p>
    </LegalLayout>
  )
}
