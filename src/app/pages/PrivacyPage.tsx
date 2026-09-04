import { LumbreSignature } from "../../components/brand/LumbreSignature";

export function PrivacyPage() {
  return (
    <main className="settings-page privacy-page">
      <header>
        <p className="eyebrow">Privacy</p>
        <h1>What TinyTools does with your data</h1>
        <p>
          Short version: your files and text are processed by your own browser and never sent
          anywhere. Page views are counted. Nothing else is collected.
        </p>
      </header>

      <section className="prose-block">
        <h2>Your files and text never leave your device</h2>
        <p>
          Every tool here runs as JavaScript inside your browser. When you open a PDF, choose an
          image, or paste text, that content is read locally, processed locally, and handed back to
          you as a download or as text on the page. There is no upload step, and no request carries
          your content.
        </p>
        <p>
          You don&apos;t have to take that on faith. Open any tool, disconnect from the internet,
          and keep using it — it will still work. Or open your browser&apos;s developer tools and
          watch the network tab while you process a file. Both take about ten seconds and are more
          convincing than anything written on this page.
        </p>
      </section>

      <section className="prose-block">
        <h2>What is measured</h2>
        <p>
          TinyTools uses Vercel Web Analytics to count page views. It records which pages are
          visited and roughly where visitors come from. It does not use cookies, does not follow you
          across other websites, and has no access to anything you type into a tool or any file you
          open.
        </p>
        <p>
          It is still a third-party service, so it is named here rather than buried. If you block
          analytics scripts, every tool keeps working exactly the same.
        </p>
      </section>

      <section className="prose-block">
        <h2>What is stored on your device</h2>
        <p>
          Some tools remember things between visits — your counters, saved text snippets, timer
          settings, your theme, and your Pro license key if you have one. All of it lives in your
          browser&apos;s local storage on this device only. It is not an account, it is not synced,
          and it is not visible to us. Clearing your browser data deletes it permanently.
        </p>
      </section>

      <section className="prose-block">
        <h2>If you buy TinyTools Pro</h2>
        <p>
          Purchases are handled entirely by Gumroad, which collects your payment details under its
          own privacy policy — we never see or store them. Gumroad issues you a license key. When
          you activate it, that key is sent to our verification endpoint, which asks Gumroad whether
          it is valid and returns yes or no. The key is stored on your device. Nothing about which
          tools you use is tied to your purchase.
        </p>
      </section>

      <section className="prose-block">
        <h2>What is never collected</h2>
        <ul>
          <li>The contents of any file you open</li>
          <li>Anything you type or paste into a tool</li>
          <li>Accounts, email addresses or passwords — there is no sign-up</li>
          <li>Advertising or cross-site tracking identifiers</li>
        </ul>
      </section>

      <section className="prose-block">
        <h2>Honest limitations</h2>
        <p>
          TinyTools is not open source today, so the strongest verification available to you is
          watching the network tab or using it offline rather than reading the source. Large files
          are limited by your device&apos;s memory, since no server is doing the work. If either of
          those is a dealbreaker for your situation, that&apos;s a fair call to make.
        </p>
      </section>

      <section className="prose-block">
        <h2>Questions</h2>
        <p>
          TinyTools is built by Lumbre Studio. Write to{" "}
          <a href="mailto:contacto@lumbrestudio.com">contacto@lumbrestudio.com</a> with anything
          about this page.
        </p>
        <LumbreSignature variant="compact" />
      </section>

      <p className="settings-footnote">Last updated 4 September 2026.</p>
    </main>
  );
}
