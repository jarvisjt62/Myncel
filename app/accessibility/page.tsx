import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Link from 'next/link'

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="bg-[#0a2540] py-12">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Accessibility Statement</h1>
          <p className="text-[#8898aa]">Our commitment to digital accessibility</p>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-lg max-w-none">
          
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Our Commitment</h2>
            <p className="text-gray-600">
              Myncel is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards to ensure our platform is usable by all people, regardless of ability.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Conformance Status</h2>
            <p className="text-gray-600 mb-4">
              We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. These guidelines define how to make web content more accessible for people with disabilities, including blindness, low vision, deafness, hearing loss, learning disabilities, cognitive limitations, limited movement, speech disabilities, and photosensitivity.
            </p>
            <p className="text-gray-600">
              WCAG 2.1 guidelines are organized under four principles: Perceivable, Operable, Understandable, and Robust (POUR). We regularly test our platform against these criteria and address any gaps.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Accessibility Features</h2>
            
            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Perceivable</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Text Alternatives:</strong> All meaningful images include descriptive alt text</li>
              <li><strong>Color Contrast:</strong> We maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text</li>
              <li><strong>Resizable Text:</strong> Text can be resized up to 200% without loss of content or functionality</li>
              <li><strong>Visual Presentation:</strong> Text spacing can be adjusted by users</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Operable</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Keyboard Navigation:</strong> All functionality is accessible via keyboard</li>
              <li><strong>No Keyboard Traps:</strong> Focus can be moved away from any component using keyboard commands</li>
              <li><strong>Focus Visible:</strong> A visible focus indicator is present on all interactive elements</li>
              <li><strong>Skip Navigation:</strong> A "Skip to main content" link is provided at the top of each page</li>
              <li><strong>Seizure Prevention:</strong> We avoid content that flashes more than three times per second</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Understandable</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Readable Content:</strong> Content is written in clear, simple language</li>
              <li><strong>Predictable Navigation:</strong> Navigation is consistent across all pages</li>
              <li><strong>Form Labels:</strong> All form fields have associated labels</li>
              <li><strong>Error Identification:</strong> Form errors are clearly described with suggestions for correction</li>
              <li><strong>Help Available:</strong> Context-sensitive help is available for complex forms</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#0a2540] mt-6 mb-3">Robust</h3>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li><strong>Semantic HTML:</strong> Proper heading hierarchy and landmark regions</li>
              <li><strong>ARIA Labels:</strong> Appropriate ARIA attributes for dynamic content</li>
              <li><strong>Status Messages:</strong> Important status changes are announced to screen readers</li>
              <li><strong>Valid Code:</strong> HTML validates against W3C standards</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Assistive Technology Compatibility</h2>
            <p className="text-gray-600 mb-4">
              Myncel is designed to be compatible with the following assistive technologies:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#f6f9fc] rounded-xl p-4">
                <h4 className="font-semibold text-[#0a2540] mb-2">Screen Readers</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• JAWS (Windows)</li>
                  <li>• NVDA (Windows)</li>
                  <li>• VoiceOver (macOS, iOS)</li>
                  <li>• TalkBack (Android)</li>
                </ul>
              </div>
              <div className="bg-[#f6f9fc] rounded-xl p-4">
                <h4 className="font-semibold text-[#0a2540] mb-2">Screen Magnification</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• ZoomText</li>
                  <li>• MAGic</li>
                  <li>• Built-in OS magnifiers</li>
                </ul>
              </div>
              <div className="bg-[#f6f9fc] rounded-xl p-4">
                <h4 className="font-semibold text-[#0a2540] mb-2">Browser Extensions</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• WAVE</li>
                  <li>• axe DevTools</li>
                  <li>• Accessibility Insights</li>
                </ul>
              </div>
              <div className="bg-[#f6f9fc] rounded-xl p-4">
                <h4 className="font-semibold text-[#0a2540] mb-2">Input Devices</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Keyboard-only navigation</li>
                  <li>• Switch devices</li>
                  <li>• Voice control</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Known Issues</h2>
            <p className="text-gray-600 mb-4">
              We are actively working to address the following known accessibility issues:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Some data visualization charts may not be fully accessible to screen readers (we provide data tables as alternatives)</li>
              <li>Some third-party integrations may not meet the same accessibility standards</li>
              <li>Mobile app accessibility improvements are in progress</li>
            </ul>
            <p className="text-gray-600 mt-4">
              We are committed to resolving these issues and continuously improving accessibility.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Feedback</h2>
            <p className="text-gray-600 mb-4">
              We welcome feedback on the accessibility of Myncel. Please let us know if you encounter any barriers or have suggestions for improvement:
            </p>
            <div className="bg-[#f6f9fc] rounded-xl p-6">
              <p className="text-gray-600 mb-2"><strong>Email:</strong></p>
              <p className="text-gray-600 mb-4"><Link href="mailto:contact@myncel.com" className="text-[#635bff] hover:underline">contact@myncel.com</Link></p>
              <p className="text-gray-600 mb-2"><strong>Phone:</strong></p>
              <p className="text-gray-600 mb-4">Available upon request</p>
              <p className="text-gray-600 mb-2"><strong>Mailing Address:</strong></p>
              <p className="text-gray-600">Available upon request</p>
            </div>
            <p className="text-gray-600 mt-4">
              We try to respond to accessibility feedback within 2 business days and to propose a solution within 10 business days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Third-Party Content</h2>
            <p className="text-gray-600">
              While we strive to ensure accessibility throughout our platform, some third-party content or integrations may not be fully accessible. We work with our partners to encourage accessibility improvements and provide alternative access methods where possible.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Enforcement Procedure</h2>
            <p className="text-gray-600">
              In case of an unsatisfactory response to your accessibility feedback, you may contact the relevant authority in your jurisdiction. In the United States, this includes the Department of Justice's ADA Information Line at 800-514-0301 or the Federal Communications Commission (FCC).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Formal Approval</h2>
            <p className="text-gray-600">
              This accessibility statement is approved by Myncel and is reviewed and updated regularly.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">For accessibility-related questions:</p>
            <div className="bg-[#f6f9fc] rounded-xl p-6">
              <p className="text-gray-600"><strong>Myncel</strong></p>
              <p className="text-gray-600">Email: <Link href="mailto:contact@myncel.com" className="text-[#635bff] hover:underline">contact@myncel.com</Link></p>
              <p className="text-gray-600 mt-2 text-sm">Please include "Accessibility" in the subject line.</p>
            </div>
          </section>

        </div>
      </div>
      
      <Footer />
    </div>
  )
}