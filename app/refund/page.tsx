import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Refund Policy" };

export default function Page() {
  return (
    <LegalPage title="Refund Policy">
      <p>
        This policy applies to paid plans of the imageprompting.org service operated by Enprico, LLC.
      </p>

      <h2>Eligibility</h2>
      <p>
        You may request a full refund within <strong>7 days</strong> of your initial subscription
        purchase, provided you have used <strong>2 or fewer generations</strong> during that period.
        Refunds are not available once more than 2 credits have been consumed, as the service has
        been materially used.
      </p>

      <h2>Non-refundable charges</h2>
      <p>
        Subscription renewals are non-refundable under any circumstances. You may cancel at any
        time to stop future renewals; cancellation takes effect at the end of the current billing
        period and you retain access to your remaining credits until then.
      </p>

      <h2>How to request a refund</h2>
      <p>
        Email <a href="mailto:support@enprico.com" className="underline text-ink">support@enprico.com</a>{" "}
        from the address on your account. Approved refunds are processed within 5–10 business days
        to your original payment method.
      </p>

      <h2>Disputes</h2>
      <p>
        Please contact us before initiating a chargeback so we can resolve any issue directly.
      </p>
    </LegalPage>
  );
}
