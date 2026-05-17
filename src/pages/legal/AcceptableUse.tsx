import LegalLayout from './LegalLayout'
import { PRODUCT_NAME } from '../../lib/constants'

export default function AcceptableUse() {
  return (
    <LegalLayout title="Acceptable Use Policy" updated="17 May 2026">
      <p>You may not misuse {PRODUCT_NAME}. Prohibited conduct includes:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Attempting to access another user&apos;s goals or check-ins without authorization</li>
        <li>Uploading malicious files or automated scraping of the demo</li>
        <li>Harassment or discriminatory content in check-in comments</li>
        <li>Circumventing cycle locks or approval workflows</li>
      </ul>
      <p className="mt-4">
        Violations may result in revoked demo access. Production tenants will follow
        employer HR policies in addition to this notice.
      </p>
    </LegalLayout>
  )
}
