import { usePageTitle } from '../hooks/usePageTitle';
import { Link } from 'react-router-dom';

export default function Terms() {
  usePageTitle('Terms of Service');
  return (
    <div style={s.page}>
      <div style={s.wrap}>
        <Link to="/" style={s.back}>← Back to Fugigeek</Link>
        <h1 style={s.h1}>Terms of Service</h1>
        <p style={s.updated}>Last updated: January 2025</p>

        <p style={s.p}>
          Welcome to Fugigeek. By creating an account or using our platform, you agree to
          these Terms of Service. Please read them carefully.
        </p>

        <h2 style={s.h2}>1. About Fugigeek</h2>
        <p style={s.p}>
          Fugigeek is an online marketplace that connects businesses, individuals, and
          professionals in Zambia to post tasks, submit proposals, and complete work.
          Fugigeek acts as an intermediary platform — we are not a party to contracts
          formed between clients and professionals.
        </p>

        <h2 style={s.h2}>2. Eligibility</h2>
        <p style={s.p}>
          You must be at least 18 years old and legally able to enter into contracts to
          use Fugigeek. By registering you confirm this.
        </p>

        <h2 style={s.h2}>3. Account responsibilities</h2>
        <ul style={s.ul}>
          <li>Provide accurate and truthful information when registering</li>
          <li>Keep your login credentials secure and confidential</li>
          <li>Notify us immediately if you suspect unauthorised access</li>
          <li>Not create multiple accounts or impersonate others</li>
        </ul>

        <h2 style={s.h2}>4. For clients (task posters)</h2>
        <ul style={s.ul}>
          <li>Post only genuine tasks you intend to have completed</li>
          <li>Provide accurate task descriptions, budgets, and deadlines</li>
          <li>Pay promptly once a proposal is accepted</li>
          <li>Review and verify work in good faith</li>
          <li>Communicate respectfully with professionals</li>
        </ul>

        <h2 style={s.h2}>5. For professionals</h2>
        <ul style={s.ul}>
          <li>Submit proposals only for tasks you are qualified and available to complete</li>
          <li>Deliver work to the standard described in your proposal</li>
          <li>Meet agreed deadlines or communicate delays promptly</li>
          <li>Maintain accurate skills and portfolio information</li>
          <li>Not solicit clients to work outside the platform</li>
        </ul>

        <h2 style={s.h2}>6. Payments</h2>
        <p style={s.p}>
          Payments are processed through MoneyUnify (MTN, Airtel, and Zamtel mobile money).
          Fugigeek charges a platform fee on completed transactions. Payment terms are
          displayed at checkout. All amounts are in Zambian Kwacha (ZMW).
        </p>

        <h2 style={s.h2}>7. Disputes</h2>
        <p style={s.p}>
          If a dispute arises between a client and professional, either party may raise it
          through the platform. Fugigeek will review and mediate disputes in good faith.
          Our decision is final for disputes handled through the platform.
        </p>

        <h2 style={s.h2}>8. Prohibited conduct</h2>
        <ul style={s.ul}>
          <li>Posting illegal, fraudulent, or misleading content</li>
          <li>Harassing, threatening, or discriminating against other users</li>
          <li>Circumventing platform fees by transacting outside Fugigeek</li>
          <li>Uploading malware, spam, or unauthorised commercial content</li>
          <li>Misrepresenting qualifications or identity</li>
        </ul>

        <h2 style={s.h2}>9. Intellectual property</h2>
        <p style={s.p}>
          Work product delivered through the platform is owned by the client upon full
          payment unless otherwise agreed in writing. Fugigeek retains ownership of the
          platform, branding, and all original content created by Fugigeek.
        </p>

        <h2 style={s.h2}>10. Limitation of liability</h2>
        <p style={s.p}>
          Fugigeek is not liable for the quality of work delivered, disputes between users,
          or any indirect, incidental, or consequential damages arising from use of the
          platform. Our total liability is limited to fees paid to Fugigeek in the 12
          months prior to the claim.
        </p>

        <h2 style={s.h2}>11. Account termination</h2>
        <p style={s.p}>
          We may suspend or terminate accounts that violate these terms. You may close
          your account at any time through Account Settings. See our{' '}
          <Link to="/privacy" style={s.a}>Privacy Policy</Link> for data retention on
          account deletion.
        </p>

        <h2 style={s.h2}>12. Changes to these terms</h2>
        <p style={s.p}>
          We may update these terms from time to time. We will notify you by email or
          in-app notification of material changes. Continued use after changes constitutes
          acceptance.
        </p>

        <h2 style={s.h2}>13. Governing law</h2>
        <p style={s.p}>
          These terms are governed by the laws of the Republic of Zambia. Any disputes
          will be subject to the jurisdiction of Zambian courts.
        </p>

        <h2 style={s.h2}>14. Contact</h2>
        <p style={s.p}>
          For any questions about these terms, contact us at{' '}
          <a href="mailto:admin@fugipay.com" style={s.a}>admin@fugipay.com</a>.
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
