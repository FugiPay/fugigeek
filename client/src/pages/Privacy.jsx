import { usePageTitle } from '../hooks/usePageTitle';
import { Link } from 'react-router-dom';

export default function Privacy() {
  usePageTitle('Privacy Policy');
  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <Link to="/" style={s.back}>← Back to Fugigeek</Link>
        <h1 style={s.h1}>Privacy Policy</h1>
        <p style={s.updated}>Last updated: January 2025</p>

        <p style={s.p}>
          Fugigeek ("we", "us", "our") is committed to protecting your personal information
          in accordance with the <strong>Zambia Data Protection Act (2021)</strong> and applicable
          international standards. This policy explains what data we collect, how we use it,
          and your rights.
        </p>

        <h2 style={s.h2}>1. Information we collect</h2>
        <p style={s.p}>When you register and use Fugigeek we collect:</p>
        <ul style={s.ul}>
          <li>Account information — name, email address, phone number, role</li>
          <li>Profile information — photo, bio, skills, portfolio, company details</li>
          <li>Transaction data — orders, payments, task history</li>
          <li>Communications — messages sent between users on the platform</li>
          <li>Usage data — pages visited, features used, device and browser information</li>
        </ul>

        <h2 style={s.h2}>2. How we use your information</h2>
        <ul style={s.ul}>
          <li>To provide and operate the Fugigeek platform</li>
          <li>To match clients with professionals and facilitate transactions</li>
          <li>To send notifications about tasks, orders, and account activity</li>
          <li>To process payments via mobile money (MTN, Airtel, Zamtel)</li>
          <li>To improve our services and prevent fraud</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 style={s.h2}>3. Sharing your information</h2>
        <p style={s.p}>
          We do not sell your personal data. We share information only:
        </p>
        <ul style={s.ul}>
          <li>Between clients and professionals as needed to complete a task</li>
          <li>With payment processors (MoneyUnify) to process transactions</li>
          <li>With cloud service providers (AWS S3) for file storage</li>
          <li>When required by law or to protect rights and safety</li>
        </ul>

        <h2 style={s.h2}>4. Data retention</h2>
        <p style={s.p}>
          We retain your personal data for as long as your account is active or as needed to
          provide services. If you request deletion, we will remove your personal data within
          30 days, retaining only financial and transaction records where required by law.
        </p>

        <h2 style={s.h2}>5. Your rights</h2>
        <p style={s.p}>Under the Zambia Data Protection Act (2021) you have the right to:</p>
        <ul style={s.ul}>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict how we process your data</li>
          <li>Data portability</li>
        </ul>
        <p style={s.p}>
          To exercise these rights, contact us at{' '}
          <a href="mailto:hello@fugipay.com" style={s.a}>hello@fugipay.com</a> or
          use the Account Settings page in your dashboard.
        </p>

        <h2 style={s.h2}>6. Security</h2>
        <p style={s.p}>
          We use industry-standard encryption (HTTPS/TLS) and secure cloud infrastructure
          to protect your data. Passwords are hashed and never stored in plain text.
        </p>

        <h2 style={s.h2}>7. Cookies</h2>
        <p style={s.p}>
          Fugigeek uses only essential cookies required for authentication and session
          management. We do not use advertising or tracking cookies.
        </p>

        <h2 style={s.h2}>8. Contact</h2>
        <p style={s.p}>
          For any privacy questions or concerns, contact us at{' '}
          <a href="mailto:hello@fugipay.com" style={s.a}>hello@fugipay.com</a>.
        </p>
      </div>
    </div>
  );
}

const s = {
  page:    { minHeight: '100vh', background: '#f9fafb', padding: '40px 24px' },
  wrap:    { maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '40px 48px' },
  back:    { fontSize: 14, color: '#6b7280', textDecoration: 'none', display: 'block', marginBottom: 32 },
  h1:      { fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 8 },
  updated: { fontSize: 13, color: '#9ca3af', marginBottom: 32, borderBottom: '1px solid #f3f4f6', paddingBottom: 24 },
  h2:      { fontSize: 17, fontWeight: 600, color: '#0f172a', marginTop: 36, marginBottom: 12 },
  p:       { fontSize: 14, color: '#374151', lineHeight: 1.75, marginBottom: 12 },
  ul:      { fontSize: 14, color: '#374151', lineHeight: 1.75, paddingLeft: 20, marginBottom: 12 },
  a:       { color: '#2563eb', textDecoration: 'none' },
};
