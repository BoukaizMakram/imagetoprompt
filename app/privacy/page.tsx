import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy — Prompto" };

export default function Page() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This Privacy Policy describes how Enprico, LLC (&ldquo;we&rdquo;, &ldquo;us&rdquo;) handles
        information when you use the Prompto Image to Prompt service.
      </p>

      <h2>Information we process</h2>
      <p>
        When you upload an image, we send the image to our inference provider so a description can
        be generated. We do not retain a copy of the image after the prompt is returned.
      </p>

      <h2>Account data</h2>
      <p>
        If you create an account, we store your email address and basic usage statistics so we can
        operate and improve the service.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a minimal set of first-party cookies for session and preferences. We do not sell
        personal information.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request deletion of your account and associated data at any time by emailing
        support@enprico.com.
      </p>

      <h2>Contact</h2>
      <p>Questions: support@enprico.com.</p>
    </LegalPage>
  );
}
