import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="bg-[#0a2540] py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-[#8898aa]">Last updated: January 2026</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              Myncel ("Myncel," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our predictive maintenance software platform and related services (collectively, the "Services").
            </p>
            <p className="text-gray-600">
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site or use the Services. By using our Services, you consent to the practices described in this policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">2.1 Personal Information</h3>
            <p className="text-gray-600 mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, company name, job title, and password when you create an account.</li>
              <li><strong>Business Information:</strong> Company size, industry type, facility locations, and manufacturing processes.</li>
              <li><strong>Equipment Data:</strong> Machine names, types, models, serial numbers, installation dates, and maintenance schedules.</li>
              <li><strong>Communication Data:</strong> Information you provide when you contact us, submit support tickets, or respond to surveys.</li>
              <li><strong>Payment Information:</strong> Billing address, payment method, and transaction history (processed securely through Stripe).</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-600 mb-4">When you use our Services, we automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns, and navigation paths.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and screen resolution.</li>
              <li><strong>Log Data:</strong> IP address, access times, referrer URLs, and system crash reports.</li>
              <li><strong>Location Data:</strong> General geographic location based on IP address (not precise GPS coordinates).</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">2.3 Information from Third Parties</h3>
            <p className="text-gray-600">
              We may receive information about you from third-party integrations you connect (such as Slack, Zapier, or QuickBooks), authentication providers (Google or SSO), and publicly available sources.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide, maintain, and improve our Services, including predictive maintenance analytics and equipment monitoring.</li>
              <li>Process transactions and send related information, including confirmations and invoices.</li>
              <li>Send administrative information, such as updates to our terms, policies, and service announcements.</li>
              <li>Respond to your comments, questions, and support requests.</li>
              <li>Communicate with you about products, services, events, and other news (with your consent where required).</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Services.</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities.</li>
              <li>Personalize and improve your experience with our Services.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-600 mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.1 Service Providers</h3>
            <p className="text-gray-600 mb-4">
              We share information with third-party vendors and service providers who perform services on our behalf, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Cloud hosting providers (Amazon Web Services, Vercel)</li>
              <li>Payment processors (Stripe)</li>
              <li>Email delivery services (Resend)</li>
              <li>Analytics providers (Google Analytics)</li>
              <li>Customer support tools</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.2 Business Transfers</h3>
            <p className="text-gray-600">
              If we are involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale of assets, your information may be transferred as part of that transaction.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.3 Legal Requirements</h3>
            <p className="text-gray-600">
              We may disclose your information if required to do so by law or in response to valid requests by public or governmental authorities.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.4 With Your Consent</h3>
            <p className="text-gray-600">
              We may share your information for any other purpose with your consent.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">5. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Encryption of data in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>Secure password hashing using bcrypt</li>
              <li>Multi-factor authentication availability</li>
              <li>Role-based access controls</li>
              <li>Regular security audits and penetration testing</li>
              <li>Employee training on data protection practices</li>
            </ul>
            <p className="text-gray-600 mt-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">6. Data Retention</h2>
            <p className="text-gray-600">
              We retain your personal information for as long as your account is active or as needed to provide you Services. We will also retain your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. Upon account deletion, we will delete or anonymize your personal information within 90 days, unless retention is required by law.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">7. Your Rights and Choices</h2>
            <p className="text-gray-600 mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information.</li>
              <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format.</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications at any time.</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="text-gray-600 mt-4">
              To exercise these rights, contact us at <Link href="mailto:contact@myncel.com" className="text-[#635bff] hover:underline">contact@myncel.com</Link>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">8. International Data Transfers</h2>
            <p className="text-gray-600">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws different from your country. By using our Services, you consent to the transfer of your information to the United States and other countries where we operate.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">9. Children's Privacy</h2>
            <p className="text-gray-600">
              Our Services are not intended for children under 16 years of age. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this privacy policy from time to time. The updated version will be indicated by an updated "Last updated" date. We encourage you to review this privacy policy frequently to stay informed.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">11. Contact Us</h2>
            <p className="text-gray-600 mb-4">If you have questions or concerns about this privacy policy, please contact us:</p>
            <div className="bg-[#f6f9fc] rounded-xl p-6">
              <p className="text-gray-600"><strong>Myncel</strong></p>
              <p className="text-gray-600">Email: <Link href="mailto:contact@myncel.com" className="text-[#635bff] hover:underline">contact@myncel.com</Link></p>
              <p className="text-gray-600">Address: Available upon request</p>
            </div>
          </section>

        </div>
      </div>
      
      <Footer />
    </div>
  )
}