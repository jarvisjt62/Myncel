import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="bg-[#0a2540] py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Security at Myncel</h1>
          <p className="text-[#8898aa]">Your data security is our top priority</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          
          <section className="mb-10">
            <p className="text-gray-600 text-lg">
              At Myncel, we understand that your manufacturing data is sensitive and critical to your operations. We've built our platform with enterprise-grade security at every layer, from infrastructure to application. This page outlines our security practices and commitments.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Infrastructure Security</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Cloud Hosting</h3>
            <p className="text-gray-600 mb-4">
              Myncel is hosted on Amazon Web Services (AWS) and Vercel, both of which maintain industry-leading security certifications including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>SOC 2 Type II</li>
              <li>ISO 27001</li>
              <li>ISO 27017 (Cloud Security)</li>
              <li>ISO 27018 (Cloud Privacy)</li>
              <li>CSA STAR</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Data Centers</h3>
            <p className="text-gray-600">
              Our infrastructure is distributed across multiple data centers with redundant power, networking, and connectivity. Data centers feature 24/7/365 security, biometric access, video surveillance, and environmental controls.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Data Encryption</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Encryption in Transit</h3>
            <p className="text-gray-600 mb-4">
              All data transmitted between your devices and our servers is encrypted using TLS 1.3 with strong cipher suites. We enforce HTTPS for all connections and use HSTS to prevent downgrade attacks.
            </p>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Encryption at Rest</h3>
            <p className="text-gray-600">
              All data stored in our databases and file storage systems is encrypted using AES-256 encryption. Encryption keys are managed through AWS Key Management Service (KMS) with automatic key rotation.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Access Control</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Authentication</h3>
            <p className="text-gray-600 mb-4">
              We implement secure authentication practices including:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Password hashing using bcrypt with strong work factors</li>
              <li>Multi-factor authentication (MFA) available for all accounts</li>
              <li>Single Sign-On (SSO) support for Enterprise plans</li>
              <li>Session management with secure, random tokens</li>
              <li>Automatic session timeout after inactivity</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Role-Based Access Control (RBAC)</h3>
            <p className="text-gray-600">
              Every Myncel organization can assign roles (Admin, Manager, Technician, Viewer) to control who can access, edit, or delete data. This ensures least-privilege access across your team.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Application Security</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Secure Development</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Secure coding practices following OWASP guidelines</li>
              <li>Code reviews required for all changes</li>
              <li>Automated security scanning in CI/CD pipeline</li>
              <li>Dependency vulnerability monitoring</li>
              <li>Regular penetration testing by third-party security firms</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Bot Protection</h3>
            <p className="text-gray-600">
              All public forms are protected by Google reCAPTCHA v3, which uses advanced risk analysis to distinguish humans from bots without requiring user interaction.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Data Backup and Recovery</h2>
            <p className="text-gray-600 mb-4">
              We maintain robust backup and recovery procedures:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Automated daily backups with point-in-time recovery</li>
              <li>Backups encrypted and stored in geographically separate regions</li>
              <li>Regular backup restoration testing</li>
              <li>Recovery Time Objective (RTO): 4 hours</li>
              <li>Recovery Point Objective (RPO): 1 hour</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Monitoring and Incident Response</h2>
            <p className="text-gray-600 mb-4">
              Our security operations include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>24/7 system monitoring and alerting</li>
              <li>Real-time log aggregation and analysis</li>
              <li>Web Application Firewall (WAF) protection</li>
              <li>DDoS mitigation</li>
              <li>Documented incident response procedures</li>
              <li>Security incident notification within 72 hours</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Compliance</h2>
            <p className="text-gray-600 mb-4">
              Myncel aligns with industry standards and regulations:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#f6f9fc] rounded-xl p-4">
                <h4 className="font-semibold text-[#0a2540] mb-2">NIST Cybersecurity Framework</h4>
                <p className="text-sm text-gray-600">We follow NIST guidelines for manufacturing cybersecurity.</p>
              </div>
              <div className="bg-[#f6f9fc] rounded-xl p-4">
                <h4 className="font-semibold text-[#0a2540] mb-2">GDPR</h4>
                <p className="text-sm text-gray-600">We support GDPR compliance for EU customers.</p>
              </div>
              <div className="bg-[#f6f9fc] rounded-xl p-4">
                <h4 className="font-semibold text-[#0a2540] mb-2">CCPA</h4>
                <p className="text-sm text-gray-600">We comply with California Consumer Privacy Act requirements.</p>
              </div>
              <div className="bg-[#f6f9fc] rounded-xl p-4">
                <h4 className="font-semibold text-[#0a2540] mb-2">SOC 2</h4>
                <p className="text-sm text-gray-600">Working toward SOC 2 Type II certification.</p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Data Retention and Deletion</h2>
            <p className="text-gray-600 mb-4">
              We retain your data only as long as necessary:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Active accounts: Data retained for the duration of your subscription</li>
              <li>Cancelled accounts: Data deleted within 90 days of termination</li>
              <li>Backups: Deleted within 30 days of account termination</li>
              <li>Request immediate deletion by contacting support</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Responsible Disclosure</h2>
            <p className="text-gray-600 mb-4">
              We appreciate security researchers who help keep Myncel secure. If you discover a vulnerability, please report it responsibly:
            </p>
            <div className="bg-[#f6f9fc] rounded-xl p-6">
              <p className="text-gray-600 mb-2"><strong>Report Security Issues To:</strong></p>
              <p className="text-gray-600">Email: <Link href="mailto:support@myncel.com" className="text-[#635bff] hover:underline">support@myncel.com</Link></p>
              <p className="text-gray-600 mt-4 text-sm">Please include detailed steps to reproduce the issue. We will respond within 48 hours and keep you informed of our progress.</p>
            </div>
            <p className="text-gray-600 mt-4">
              We ask that you do not publicly disclose vulnerabilities until we've had a reasonable time to address them.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Security Contact</h2>
            <p className="text-gray-600 mb-4">For security-related questions or concerns:</p>
            <div className="bg-[#f6f9fc] rounded-xl p-6">
              <p className="text-gray-600"><strong>General Security Questions:</strong></p>
              <p className="text-gray-600 mb-4">Email: <Link href="mailto:contact@myncel.com" className="text-[#635bff] hover:underline">contact@myncel.com</Link></p>
              <p className="text-gray-600"><strong>Security Vulnerabilities:</strong></p>
              <p className="text-gray-600">Email: <Link href="mailto:support@myncel.com" className="text-[#635bff] hover:underline">support@myncel.com</Link></p>
            </div>
          </section>

        </div>
      </div>
      
      <Footer />
    </div>
  )
}