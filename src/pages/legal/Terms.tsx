import LegalLayout from './LegalLayout'
import { PRODUCT_NAME } from '../../lib/constants'

export default function Terms() {
  return (
    <LegalLayout title="Terms & Conditions" updated="17 May 2026">
      <p>
        By accessing {PRODUCT_NAME}, you agree to these terms. This is a demonstration
        environment; do not enter real confidential business data.
      </p>
      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
        Use of the service
      </h2>
      <p>
        The portal supports goal setting, weighted goal sheets, quarterly check-ins, and
        manager review. You are responsible for accurate entries during open check-in
        windows defined by your organization.
      </p>
      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
        Accounts
      </h2>
      <p>
        Demo credentials are provided for evaluation. Do not share passwords or use the
        demo for production HR decisions.
      </p>
      <h2 className="font-heading text-lg font-bold text-[var(--text-primary)]">
        Limitation of liability
      </h2>
      <p>
        {PRODUCT_NAME} is provided &quot;as is&quot; without warranties. We are not liable
        for decisions made based on prototype data.
      </p>
    </LegalLayout>
  )
}
