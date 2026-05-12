import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'SMS Opt-In Consent & Messaging Program — Myncel',
  description:
    'Myncel SMS messaging program details: opt-in consent flow, consent language, sample messages, opt-out instructions, and compliance information for toll-free number (844) 994-1183.',
  alternates: { canonical: 'https://www.myncel.com/sms-consent' },
};

export default function SmsConsentPage() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0a2540] py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-purple-200 font-medium mb-4">
            📱 SMS Compliance Documentation
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Myncel SMS Messaging Program
          </h1>
          <p className="text-[#8898aa] text-lg">
            Opt-in consent flow, consent language, sample messages, and opt-out information for toll-free number <strong className="text-white">(844) 994-1183</strong>.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-3xl mx-auto px-6 space-y-10">

          {/* ── 1. Program Overview ── */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">1. Program Overview</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Program Name',    'Myncel Operational SMS Notifications'],
                  ['Sender Number',   '(844) 994-1183 — US toll-free'],
                  ['Message Type',    'Transactional / Operational (NOT marketing)'],
                  ['Use Cases',       'Work order assignments, equipment alerts, preventive maintenance reminders'],
                  ['Frequency',       'Varies based on user settings and equipment events (typically 1–10/day)'],
                  ['Rates',           'Message & data rates may apply'],
                  ['Opt-In Method',   'Explicit user action inside the Myncel web platform (see Section 3)'],
                  ['STOP Command',    'Immediately unsubscribes; sends confirmation'],
                  ['HELP Command',    'Returns support contact and website info'],
                  ['Support Email',   'support@myncel.com'],
                  ['Privacy Policy',  'https://www.myncel.com/privacy'],
                  ['Terms of Service','https://www.myncel.com/terms'],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="py-2.5 pr-4 font-semibold text-[#0a2540] w-44 align-top">{label}</td>
                    <td className="py-2.5 text-[#425466]">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── 2. Consent Language ── */}
          <div className="rounded-xl border border-[#635bff] bg-purple-50 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-2">2. Exact Consent Language Shown to Users</h2>
            <p className="text-sm text-[#8898aa] mb-5">
              The following text is displayed verbatim on the <strong>Settings → Notifications</strong> page,{' '}
              <em>directly above and beside the SMS opt-in toggle</em>. It is not buried in the Terms of Service or Privacy Policy.
            </p>

            {/* Consent box mockup */}
            <div className="bg-white rounded-xl border-2 border-[#635bff] p-6 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📲</span>
                <p className="font-bold text-[#0a2540] text-base">Enable SMS Text Message Notifications</p>
              </div>
              <p className="text-sm text-[#425466] leading-relaxed">
                By enabling SMS notifications and entering your phone number below, you agree to receive
                automated text messages from <strong>Myncel</strong> at the number provided. Messages may
                include work order updates, critical equipment alerts, and maintenance reminders.
              </p>
              <p className="text-sm text-[#425466] leading-relaxed">
                Message frequency varies based on your settings. Message and data rates may apply.
                Reply <strong>HELP</strong> for help. Reply <strong>STOP</strong> at any time to
                unsubscribe and stop receiving SMS messages from Myncel.
              </p>
              <p className="text-xs text-[#8898aa]">
                This SMS consent is separate from and not required by our{' '}
                <Link href="/privacy" className="underline">Privacy Policy</Link> or{' '}
                <Link href="/terms" className="underline">Terms of Service</Link>.
                You may use Myncel without enabling SMS notifications.
              </p>
              {/* Toggle mockup */}
              <div className="flex items-center gap-3 mt-2 bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="w-12 h-6 bg-[#635bff] rounded-full relative flex-shrink-0">
                  <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0a2540]">
                    I agree to receive SMS text message notifications from Myncel
                  </p>
                  <p className="text-xs text-[#8898aa]">Toggle on to opt in to SMS alerts. Reply STOP to unsubscribe at any time.</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#8898aa] mt-3">
              ↑ This is a visual representation of the exact UI shown to users on the Settings → Notifications page.
              The toggle is OFF by default. Users must actively toggle it ON to consent.
            </p>
          </div>

          {/* ── 3. Step-by-Step Opt-In Flow ── */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-6">3. Step-by-Step Opt-In Flow</h2>
            <p className="text-sm text-[#425466] mb-6">
              SMS messages are <strong>only sent</strong> to registered Myncel users who complete all of the following steps.
              No messages are sent unless the user explicitly opts in.
            </p>
            <div className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'Create a Myncel account',
                  desc: 'User signs up at myncel.com/signup with their name, email, and organization details.',
                },
                {
                  step: '2',
                  title: 'Log in and open Settings → Notifications',
                  desc: 'After signing in, the user navigates to the Settings section and clicks "Notifications" in the left sidebar.',
                },
                {
                  step: '3',
                  title: 'Read the SMS consent disclosure',
                  desc: 'The user is presented with the full consent text shown in Section 2 above. This text is displayed prominently before any toggle or phone number field.',
                },
                {
                  step: '4',
                  title: 'Explicitly toggle ON the SMS consent',
                  desc: 'The toggle is OFF by default. The user must actively click it to ON. The toggle label reads: "I agree to receive SMS text message notifications from Myncel". Sub-text: "Toggle on to opt in to SMS alerts. Reply STOP to unsubscribe at any time."',
                },
                {
                  step: '5',
                  title: 'Enter mobile phone number',
                  desc: 'User enters their mobile phone number. The field is only shown after the consent toggle is turned ON.',
                },
                {
                  step: '6',
                  title: 'Choose notification types',
                  desc: 'User selects which types of SMS they want: Work Order Alerts, Critical Equipment Alerts only, or All Alerts.',
                },
                {
                  step: '7',
                  title: 'Click "Save Changes"',
                  desc: 'User saves their preferences. Immediately upon saving, an opt-in confirmation SMS is sent.',
                },
                {
                  step: '8',
                  title: 'Receive opt-in confirmation SMS',
                  desc: 'Myncel sends: "Myncel: You are now opted in to receive SMS text message notifications about your maintenance operations. Msg & data rates may apply. Reply HELP for help, STOP to opt out."',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-[#635bff] text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-semibold text-[#0a2540]">{item.title}</p>
                    <p className="text-sm text-[#425466] mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 4. Sample Messages ── */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">4. Sample SMS Messages</h2>
            <p className="text-sm text-[#8898aa] mb-5">
              All messages begin with the <strong>[Myncel]</strong> brand identifier and end with STOP opt-out
              instructions. Messages are transactional only — no promotions, offers, or marketing.
            </p>
            <div className="space-y-3">
              {[
                {
                  label: 'Work Order Assignment — Critical',
                  color: 'bg-red-50 border-red-200',
                  badge: 'bg-red-100 text-red-700',
                  msg: '[Myncel] Work Order #WO-1042 assigned to you: "Replace hydraulic seal" on Press Brake #3. Priority: CRITICAL. Log in: myncel.com Reply STOP to opt out.',
                },
                {
                  label: 'Critical Equipment Alert',
                  color: 'bg-orange-50 border-orange-200',
                  badge: 'bg-orange-100 text-orange-700',
                  msg: '[Myncel] CRITICAL Alert: Temperature sensor exceeded threshold (185°F) on Boiler #2. Check your dashboard immediately. Reply STOP to opt out.',
                },
                {
                  label: 'Preventive Maintenance Overdue',
                  color: 'bg-yellow-50 border-yellow-200',
                  badge: 'bg-yellow-100 text-yellow-700',
                  msg: '[Myncel] PM Overdue: "Quarterly generator inspection" on Generator A is 3 day(s) overdue. Schedule maintenance now at myncel.com Reply STOP to opt out.',
                },
                {
                  label: 'Work Order Assignment — Medium',
                  color: 'bg-blue-50 border-blue-200',
                  badge: 'bg-blue-100 text-blue-700',
                  msg: '[Myncel] Work Order #WO-1043 assigned to you: "Inspect conveyor belt alignment" on Line 2 Conveyor. Priority: MEDIUM. Log in: myncel.com Reply STOP to opt out.',
                },
                {
                  label: 'Opt-In Confirmation',
                  color: 'bg-green-50 border-green-200',
                  badge: 'bg-green-100 text-green-700',
                  msg: 'Myncel: You are now opted in to receive SMS text message notifications about your maintenance operations. Msg & data rates may apply. Reply HELP for help, STOP to opt out.',
                },
                {
                  label: 'STOP Confirmation',
                  color: 'bg-slate-50 border-slate-200',
                  badge: 'bg-slate-100 text-slate-600',
                  msg: 'Myncel: You have been unsubscribed from SMS notifications. You will receive no further messages. Reply START to re-subscribe or visit myncel.com/settings.',
                },
                {
                  label: 'HELP Response',
                  color: 'bg-slate-50 border-slate-200',
                  badge: 'bg-slate-100 text-slate-600',
                  msg: 'Myncel Alerts: For help visit myncel.com/help or email support@myncel.com. Reply STOP to unsubscribe. Msg & data rates may apply.',
                },
              ].map((item, i) => (
                <div key={i} className={`rounded-lg border p-4 ${item.color}`}>
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${item.badge}`}>
                    {item.label}
                  </span>
                  <p className="text-sm font-mono text-[#0a2540]">{item.msg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── 5. Opt-Out Methods ── */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">5. Opt-Out Instructions</h2>
            <p className="text-[#425466] mb-5">
              Users can opt out at any time using any of the following methods. Opt-out requests are honored immediately.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: '📱',
                  title: 'Reply STOP',
                  desc: 'Reply STOP to any Myncel SMS message. You will be immediately unsubscribed and receive a one-time confirmation.',
                },
                {
                  icon: '⚙️',
                  title: 'Account Settings',
                  desc: 'Log in → Settings → Notifications → Toggle off "SMS Notifications" → Save Changes.',
                },
                {
                  icon: '📧',
                  title: 'Email Support',
                  desc: 'Email support@myncel.com and request removal from SMS notifications. Removed within 24 hours.',
                },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-5 text-center border border-slate-200">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-[#0a2540] text-sm mb-2">{item.title}</p>
                  <p className="text-xs text-[#425466]">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> After sending STOP, users receive exactly one confirmation message and then receive no further SMS messages unless they re-subscribe by texting START or re-enabling SMS in their account settings.
              </p>
            </div>
          </div>

          {/* ── 6. No Marketing ── */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-3">6. Non-Marketing Declaration</h2>
            <p className="text-[#425466] leading-relaxed">
              Myncel's SMS program is exclusively <strong>operational and transactional</strong>. We do not send:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-[#425466]">
              {[
                'Promotional offers or discounts',
                'Marketing campaigns',
                'Newsletter or blog content',
                'Third-party advertisements',
                'Any messages to non-users or people who have not opted in',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">✗</span> {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#425466] mt-4">
              All messages are sent solely to users who have accounts on the Myncel platform and have
              explicitly opted in to SMS notifications for their maintenance operations.
            </p>
          </div>

          {/* ── Footer links ── */}
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200">
            <Link href="/privacy" className="inline-flex items-center gap-2 bg-[#f6f9fc] border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:bg-slate-100 transition-colors">
              📄 Privacy Policy
            </Link>
            <Link href="/terms" className="inline-flex items-center gap-2 bg-[#f6f9fc] border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:bg-slate-100 transition-colors">
              📋 Terms of Service
            </Link>
            <Link href="/sms-opt-in" className="inline-flex items-center gap-2 bg-[#f6f9fc] border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:bg-slate-100 transition-colors">
              📱 SMS Opt-In Info
            </Link>
            <Link href="/help" className="inline-flex items-center gap-2 bg-[#f6f9fc] border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:bg-slate-100 transition-colors">
              ❓ Help Center
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 bg-[#635bff] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#4f46e5] transition-colors">
              📧 Contact Support
            </Link>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
