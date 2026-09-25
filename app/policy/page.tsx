import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — PINO House",
  description: "Privacy Policy for PINO House and PINO Notifier.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <a className={styles.brand} href="/">PINO House</a>
          <a className={styles.back} href="/">Back to home</a>
        </header>
        <article className={styles.article}>
          <h1>Privacy Policy</h1>
          <p className={styles.updated}>Effective September 25, 2026</p>
          <p>This Privacy Policy explains how PINO House handles information when you use our website, services, and PINO Notifier, our email notification service.</p>
          <div className={styles.notice}><strong>PINO Notifier</strong> uses your Google account only to authenticate authorized PINO operators and support the email-notification workflow they initiate. We do not sell Google user data or use it for advertising.</div>
          <h2>Information we collect</h2>
          <p>Depending on the service you use, we may receive basic account information such as your name, email address, account identifier, authentication state, and operational records needed to provide PINO services.</p>
          <h2>Google account data</h2>
          <p>When Google sign-in is used, we access only the information and permissions presented on the Google consent screen. Google account information is used to authenticate the operator, associate activity with the correct account, and perform the requested PINO Notifier workflow.</p>
          <h2>How we use information</h2>
          <ul>
            <li>Provide and secure PINO House services and PINO Notifier.</li>
            <li>Authenticate authorized users and prevent unauthorized access.</li>
            <li>Send or manage notifications requested through the service.</li>
            <li>Maintain service reliability, audit records, and operational security.</li>
          </ul>
          <h2>Google API data and Limited Use</h2>
          <p>PINO Notifier’s use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.</p>
          <h2>Sharing and disclosure</h2>
          <p>We do not sell personal information. We disclose information only when needed to operate the service, comply with law, protect users or PINO House, or work with service providers acting on our behalf.</p>
          <h2>Retention and security</h2>
          <p>We retain information only for as long as reasonably necessary for the purposes described above, including security, audit, and legal obligations. We use access controls and other reasonable safeguards appropriate to the information we handle.</p>
          <h2>Your choices</h2>
          <p>You may stop using the service, revoke Google account access from your Google account settings, or contact PINO House about privacy questions and applicable data requests.</p>
          <h2>Contact</h2>
          <p>For privacy questions, contact PINO House through the contact channels published on <a href="/">pinohouse.art</a>.</p>
        </article>
        <footer className={styles.footer}><span>© {new Date().getFullYear()} PINO House</span><a href="/term">Terms of Service</a></footer>
      </div>
    </main>
  );
}
