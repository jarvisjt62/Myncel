import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="bg-[#0a2540] py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-[#8898aa]">Last updated: January 2026</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-600 mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and Myncel ("Myncel," "we," "us," or "our") concerning your access to and use of our predictive maintenance software platform and related services (collectively, the "Services").
            </p>
            <p className="text-gray-600">
              By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access the Services. If you are using the Services on behalf of an organization, you are agreeing to these Terms on behalf of that organization.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">2. Description of Services</h2>
            <p className="text-gray-600 mb-4">Myncel provides a cloud-based predictive maintenance platform that helps small manufacturers:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Monitor equipment health and performance</li>
              <li>Schedule and track preventive maintenance tasks</li>
              <li>Manage work orders and maintenance requests</li>
              <li>Track parts inventory and supplier relationships</li>
              <li>Analyze equipment downtime and maintenance costs</li>
              <li>Receive alerts and notifications for maintenance activities</li>
              <li>Generate reports and compliance documentation</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">3. Account Registration and Security</h2>
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">3.1 Registration</h3>
            <p className="text-gray-600 mb-4">
              To use certain features of the Services, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
            </p>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">3.2 Account Security</h3>
            <p className="text-gray-600 mb-4">
              You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">3.3 Account Restrictions</h3>
            <p className="text-gray-600">
              We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders at our sole discretion.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">4. Subscription and Payment Terms</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.1 Subscriptions</h3>
            <p className="text-gray-600 mb-4">
              Our Services are offered on a subscription basis. You will be billed in advance on a recurring, periodic basis (monthly or annually, as selected). Your subscription will automatically renew unless you cancel before the renewal date.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.2 Pricing</h3>
            <p className="text-gray-600 mb-4">
              Current pricing is available on our pricing page. We may change our pricing at any time. Price changes will be communicated at least 30 days in advance and will not affect current subscription periods.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.3 Payment Methods</h3>
            <p className="text-gray-600 mb-4">
              You agree to provide a valid payment method. We use Stripe to process payments securely. You authorize us to charge your payment method for the total amount of your subscription and any additional fees.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.4 Refunds</h3>
            <p className="text-gray-600">
              Subscription fees are generally non-refundable. We may provide refunds on a case-by-case basis at our sole discretion. To request a refund, contact us at <Link href="mailto:contact@myncel.com" className="text-[#635bff] hover:underline">contact@myncel.com</Link>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">5. Acceptable Use Policy</h2>
            <p className="text-gray-600 mb-4">You agree not to use the Services:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>For any unlawful purpose or in violation of any laws</li>
              <li>To transmit viruses, malware, or other malicious code</li>
              <li>To infringe upon the intellectual property rights of others</li>
              <li>To harass, abuse, or harm another person</li>
              <li>To interfere with or disrupt the Services or servers</li>
              <li>To attempt to gain unauthorized access to any portion of the Services</li>
              <li>To use automated systems (bots, scrapers) without permission</li>
              <li>To resell or redistribute the Services without authorization</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">6. Intellectual Property Rights</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">6.1 Our Property</h3>
            <p className="text-gray-600 mb-4">
              The Services and its original content, features, and functionality are owned by Myncel and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">6.2 Your Data</h3>
            <p className="text-gray-600 mb-4">
              You retain ownership of all data you upload to the Services, including equipment information, maintenance records, and other business data. You grant us a limited license to use, store, and process your data solely to provide the Services.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">6.3 Feedback</h3>
            <p className="text-gray-600">
              If you provide feedback or suggestions regarding the Services, we may use such feedback without any obligation to you.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">7. Third-Party Integrations</h2>
            <p className="text-gray-600 mb-4">
              The Services may integrate with third-party applications and services (such as Slack, QuickBooks, and Zapier). Your use of such integrations is subject to the terms and privacy policies of those third parties. We are not responsible for third-party services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">8. Service Level and Availability</h2>
            <p className="text-gray-600 mb-4">
              We strive to maintain 99.9% uptime for our Services. However, we do not guarantee that the Services will be uninterrupted, secure, or error-free. Scheduled maintenance will be communicated in advance when possible.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, MYNCEL SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Your access to or use of or inability to access or use the Services</li>
              <li>Any conduct or content of any third party on the Services</li>
              <li>Any content obtained from the Services</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">10. Indemnification</h2>
            <p className="text-gray-600">
              You agree to defend, indemnify, and hold harmless Myncel and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your access to or use of the Services, or your violation of these Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">11. Termination</h2>
            <p className="text-gray-600 mb-4">
              You may terminate your account at any time through your account settings or by contacting us. Upon termination, your right to use the Services will immediately cease. We may terminate or suspend your account at any time for any reason, including violation of these Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">12. Governing Law</h2>
            <p className="text-gray-600">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of Delaware.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">13. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Services after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">14. Contact Us</h2>
            <p className="text-gray-600 mb-4">If you have questions about these Terms, please contact us:</p>
            <div className="bg-[#f6f9fc] rounded-xl p-6">
              <p className="text-gray-600"><strong>Myncel</strong></p>
              <p className="text-gray-600">Email: <Link href="mailto:contact@myncel.com" className="text-[#635bff] hover:underline">contact@myncel.com</Link></p>
            </div>
          </section>

        </div>
      </div>
      
      <Footer />
    </div>
  )
}