import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "About Us" };

export default function Page() {
  return (
    <LegalPage title="About Us">
      <p>
        imageprompting.org is a small studio building practical tools for designers, illustrators,
        and creators who use AI image generators in their daily work.
      </p>
      <p>
        Our Image to Prompt tool is built around a simple idea: you already have references — you
        shouldn&apos;t have to translate them into prompts by hand. Drop an image, get a prompt,
        iterate.
      </p>
      <p>
        imageprompting.org is operated by <strong>Enprico, LLC</strong>.
      </p>
    </LegalPage>
  );
}
