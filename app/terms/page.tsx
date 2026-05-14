import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Terms and Conditions" };

export default function Page() {
  return (
    <LegalPage title="Terms and Conditions">
      <p>
        By using the imageprompting.org service operated by Enprico, LLC, you agree to these Terms
        and Conditions.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to upload content that is unlawful, sexually explicit, pornographic, violent,
        hateful, or otherwise inappropriate. NSFW and haram content is strictly prohibited.
        Uploading content depicting minors inappropriately is forbidden and will be reported to the
        relevant authorities.
      </p>

      <h2>Your content</h2>
      <p>
        You retain ownership of images you upload and prompts you generate. You are responsible for
        ensuring you have the right to use the images you submit.
      </p>

      <h2>Availability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; without warranties of any kind. We may modify or
        discontinue features at any time.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        Enprico, LLC is not liable for any indirect, incidental, or consequential damages arising
        from use of the service.
      </p>

      <h2>Contact</h2>
      <p>Questions: support@enprico.com.</p>
    </LegalPage>
  );
}
