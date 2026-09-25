import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Terms of Service — PINO House",
  description: "Terms of Service for PINO House and PINO Notifier.",
};

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <a className={styles.brand} href="/">PINO House</a>
          <a className={styles.back} href="/">Back to home</a>
        </header>
        <article className={styles.article}>
          <h1>Terms of Service</h1>
          <p className={styles.updated}>Effective September 25, 2026</p>
          <p>These Terms govern access to PINO House digital services, including PINO Notifier, the email notification service operated by PINO House.</p>
          <h2>Authorized use</h2>
          <p>You may use the services only for legitimate PINO House purposes and only with accounts and permissions you are authorized to use. You are responsible for keeping your account access secure.</p>
          <h2>PINO Notifier</h2>
          <p>PINO Notifier may use Google sign-in to authenticate authorized operators. By using it, you authorize the service to use the permissions shown on the Google consent screen for the requested notification workflow.</p>
          <h2>Acceptable use</h2>
          <p>You must not misuse the services, attempt unauthorized access, interfere with service operation, or use PINO House systems to send unlawful, deceptive, or abusive communications.</p>
          <h2>Availability and changes</h2>
          <p>We may update, suspend, or modify digital services when reasonably necessary for security, reliability, product improvement, or legal compliance.</p>
          <h2>Privacy</h2>
          <p>Our handling of personal information is described in the <a href="/policy">Privacy Policy</a>.</p>
          <h2>Contact</h2>
          <p>Questions about these Terms can be directed to PINO House through the contact channels published on <a href="/">pinohouse.art</a>.</p>
        </article>
        <footer className={styles.footer}><span>© {new Date().getFullYear()} PINO House</span><a href="/policy">Privacy Policy</a></footer>
      </div>
    </main>
  );
}
