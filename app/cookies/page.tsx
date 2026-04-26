import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="bg-[#0a2540] py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Cookie Policy</h1>
          <p className="text-[#8898aa]">Last updated: January 2026</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">1. What Are Cookies?</h2>
            <p className="text-gray-600">
              Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, understanding how you use our site, and improving our services. Cookies do not contain viruses and cannot access your hard drive or personal data.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">2. Types of Cookies We Use</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">2.1 Essential Cookies</h3>
            <p className="text-gray-600 mb-4">
              These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt out of these cookies.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-[#f6f9fc]">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Cookie Name</th>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Purpose</th>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-3 text-sm text-gray-600">session_token</td>
                    <td className="p-3 text-sm text-gray-600">Maintains your logged-in session</td>
                    <td className="p-3 text-sm text-gray-600">30 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">csrf_token</td>
                    <td className="p-3 text-sm text-gray-600">Prevents cross-site request forgery</td>
                    <td className="p-3 text-sm text-gray-600">Session</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">preferences</td>
                    <td className="p-3 text-sm text-gray-600">Stores your cookie preferences</td>
                    <td className="p-3 text-sm text-gray-600">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-8 mb-3">2.2 Functional Cookies</h3>
            <p className="text-gray-600 mb-4">
              These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-[#f6f9fc]">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Cookie Name</th>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Purpose</th>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-3 text-sm text-gray-600">theme</td>
                    <td className="p-3 text-sm text-gray-600">Remembers your theme preference</td>
                    <td className="p-3 text-sm text-gray-600">1 year</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">language</td>
                    <td className="p-3 text-sm text-gray-600">Remembers your language preference</td>
                    <td className="p-3 text-sm text-gray-600">1 year</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">timezone</td>
                    <td className="p-3 text-sm text-gray-600">Stores your timezone for scheduling</td>
                    <td className="p-3 text-sm text-gray-600">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-8 mb-3">2.3 Analytics Cookies</h3>
            <p className="text-gray-600 mb-4">
              These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-[#f6f9fc]">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Cookie Name</th>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Purpose</th>
                    <th className="text-left p-3 text-sm font-semibold text-[#0a2540]">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="p-3 text-sm text-gray-600">_ga</td>
                    <td className="p-3 text-sm text-gray-600">Google Analytics - distinguishes users</td>
                    <td className="p-3 text-sm text-gray-600">2 years</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sm text-gray-600">_ga_*</td>
                    <td className="p-3 text-sm text-gray-600">Google Analytics - maintains session state</td>
                    <td className="p-3 text-sm text-gray-600">2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-8 mb-3">2.4 Marketing Cookies</h3>
            <p className="text-gray-600">
              These cookies are used to track visitors across websites. They help display relevant and engaging ads. We currently do not use marketing cookies, but may in the future with your consent.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">3. Third-Party Cookies</h2>
            <p className="text-gray-600 mb-4">
              We use services from third-party providers that may set their own cookies:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Google Analytics:</strong> For understanding how users interact with our website</li>
              <li><strong>Google reCAPTCHA:</strong> For protecting forms from spam and abuse</li>
              <li><strong>Stripe:</strong> For securely processing payments</li>
              <li><strong>Vercel:</strong> For content delivery and performance monitoring</li>
            </ul>
            <p className="text-gray-600 mt-4">
              These third parties may use cookies according to their own privacy policies. We encourage you to review their policies.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">4. Managing Cookies</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.1 Browser Settings</h3>
            <p className="text-gray-600 mb-4">
              Most web browsers allow you to control cookies through their settings. You can:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>View what cookies are stored on your device</li>
              <li>Accept or reject cookies</li>
              <li>Delete all or specific cookies</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.2 Browser-Specific Instructions</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="block p-4 border border-gray-200 rounded-lg hover:border-[#635bff] transition-colors">
                <p className="font-semibold text-[#0a2540]">Google Chrome</p>
                <p className="text-sm text-gray-600">Manage cookies in Chrome</p>
              </a>
              <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener" className="block p-4 border border-gray-200 rounded-lg hover:border-[#635bff] transition-colors">
                <p className="font-semibold text-[#0a2540]">Mozilla Firefox</p>
                <p className="text-sm text-gray-600">Manage cookies in Firefox</p>
              </a>
              <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener" className="block p-4 border border-gray-200 rounded-lg hover:border-[#635bff] transition-colors">
                <p className="font-semibold text-[#0a2540]">Apple Safari</p>
                <p className="text-sm text-gray-600">Manage cookies in Safari</p>
              </a>
              <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener" className="block p-4 border border-gray-200 rounded-lg hover:border-[#635bff] transition-colors">
                <p className="font-semibold text-[#0a2540]">Microsoft Edge</p>
                <p className="text-sm text-gray-600">Manage cookies in Edge</p>
              </a>
            </div>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">4.3 Impact of Disabling Cookies</h3>
            <p className="text-gray-600">
              If you disable cookies, some features of our website may not function properly. Essential cookies cannot be disabled without affecting core functionality.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">5. Do Not Track</h2>
            <p className="text-gray-600">
              Some browsers have a "Do Not Track" feature that signals to websites that you do not want your online activity tracked. We currently respond to Do Not Track signals by not loading analytics cookies when DNT is enabled in your browser.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">6. Updates to This Policy</h2>
            <p className="text-gray-600">
              We may update this Cookie Policy from time to time to reflect changes in technology or law. We will post any changes on this page and update the "Last updated" date. We encourage you to check this page periodically.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">7. Contact Us</h2>
            <p className="text-gray-600 mb-4">If you have questions about our use of cookies, please contact us:</p>
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