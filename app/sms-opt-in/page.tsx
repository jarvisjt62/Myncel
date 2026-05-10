import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'SMS Notifications Opt-In — Myncel',
  description: 'Learn how Myncel sends SMS text message notifications to maintenance technicians and facility managers, and how to opt in or opt out.',
  alternates: { canonical: 'https://www.myncel.com/sms-opt-in' },
};

export default function SmsOptInPage() {
  return (
    <div className="min-h-screen bg-white text-[#0a2540]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0a2540] py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-purple-200 font-medium mb-4">
            📱 SMS Notifications
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Myncel SMS Notification Program
          </h1>
          <p className="text-[#8898aa] text-lg">
            How we send text messages, what you receive, and how to opt in or out.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-14">
        <div className="max-w-3xl mx-auto px-6 space-y-10">

          {/* Program Description */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-3">📋 Program Description</h2>
            <p className="text-[#425466] leading-relaxed mb-3">
              Myncel operates a CMMS (Computerized Maintenance Management System) platform used by maintenance technicians, facility managers, and operations teams. Our SMS notification program sends <strong>operational, transactional text messages</strong> to registered platform users who have explicitly opted in.
            </p>
            <p className="text-[#425466] leading-relaxed">
              Messages are sent from <strong>(844) 994-1183</strong> and include work order assignments, critical equipment alerts, and preventive maintenance reminders. This is a <strong>non-marketing</strong> notification program. We do not send promotional or marketing SMS messages.
            </p>
          </div>

          {/* Who Receives Messages */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-3">👥 Who Receives Messages</h2>
            <p className="text-[#425466] leading-relaxed mb-4">
              SMS messages are only sent to <strong>registered Myncel users</strong> who have:
            </p>
            <ol className="list-decimal pl-6 text-[#425466] space-y-2">
              <li>Created a Myncel account at <Link href="/signup" className="text-[#635bff] underline">myncel.com/signup</Link></li>
              <li>Navigated to <strong>Settings → Notifications</strong> in their account</li>
              <li>Toggled on <strong>"I agree to receive SMS text message notifications from Myncel"</strong></li>
              <li>Entered their mobile phone number</li>
              <li>Saved their preferences</li>
            </ol>
            <p className="text-[#425466] leading-relaxed mt-4">
              No SMS messages are sent to users who have not completed all steps above. Consent is explicit, granular, and user-initiated.
            </p>
          </div>

          {/* Opt-In Flow Visual */}
          <div className="rounded-xl border border-[#635bff] bg-purple-50 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-6">✅ Opt-In Flow (Step by Step)</h2>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Sign in to Myncel', desc: 'User logs in at myncel.com/signin with their registered account credentials.' },
                { step: '2', title: 'Go to Settings → Notifications', desc: 'User navigates to the Settings section and clicks "Notifications" in the sidebar.' },
                { step: '3', title: 'Read the SMS consent disclosure', desc: 'User sees the full opt-in consent box explaining: what messages they will receive, that message & data rates may apply, and how to use HELP and STOP.' },
                { step: '4', title: 'Toggle "I agree to receive SMS text message notifications from Myncel"', desc: 'User explicitly toggles ON the SMS consent toggle. The consent language is displayed directly next to the toggle — it is not buried in terms or privacy policy.' },
                { step: '5', title: 'Enter mobile phone number', desc: 'User enters their mobile phone number in E.164 format (e.g. +1 234 567 8900).' },
                { step: '6', title: 'Select notification types', desc: 'User selects which types of SMS they want: Work Order Alerts, Critical Equipment Alerts, or Critical Only.' },
                { step: '7', title: 'Save preferences', desc: 'User clicks "Save Changes". An SMS confirmation is sent: "Myncel: You are now opted in to SMS notifications. Msg & data rates may apply. Reply HELP for help, STOP to opt out."' },
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

          {/* Consent Language */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">📝 Exact Consent Language Shown to Users</h2>
            <p className="text-sm text-[#8898aa] mb-4">The following text is displayed verbatim on the Settings → Notifications page, directly above the opt-in toggle:</p>
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 space-y-3">
              <p className="font-semibold text-[#0a2540]">📲 Enable SMS Text Message Notifications</p>
              <p className="text-sm text-[#425466]">
                By enabling SMS notifications and entering your phone number below, you agree to receive automated text messages from <strong>Myncel</strong> at the number provided. Messages may include work order updates, critical equipment alerts, and maintenance reminders.
              </p>
              <p className="text-sm text-[#425466]">
                Message frequency varies based on your settings. Message and data rates may apply. Reply <strong>HELP</strong> for help. Reply <strong>STOP</strong> at any time to unsubscribe and stop receiving SMS messages.
              </p>
              <p className="text-xs text-[#8898aa]">
                By enabling SMS, you consent to receiving text messages as described above. This consent is separate from our Privacy Policy and Terms of Service.
              </p>
            </div>
            <div className="mt-4 bg-slate-50 rounded-lg border border-slate-200 p-5">
              <p className="font-semibold text-[#0a2540] text-sm mb-2">Toggle label text (shown next to the toggle switch):</p>
              <p className="text-sm text-[#635bff] font-medium">"I agree to receive SMS text message notifications from Myncel"</p>
              <p className="text-xs text-[#8898aa] mt-1">Sub-label: "Toggle on to opt in to SMS alerts. Reply STOP to unsubscribe at any time."</p>
            </div>
          </div>

          {/* Sample Messages */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">💬 Example SMS Messages</h2>
            <p className="text-sm text-[#8898aa] mb-5">All messages begin with "[Myncel]" brand identifier and end with opt-out instructions:</p>
            <div className="space-y-3">
              {[
                { label: 'Work Order (High Priority)', color: 'bg-red-50 border-red-200 text-red-800', msg: '[Myncel] New HIGH work order WO-1042: "Replace HVAC filter" on Air Handler Unit 3. Log in to view. Reply STOP to opt out.' },
                { label: 'Critical Alert', color: 'bg-orange-50 border-orange-200 text-orange-800', msg: '[Myncel] CRITICAL Alert: Temperature exceeding threshold on Boiler #2. Check your dashboard immediately. Reply STOP to opt out.' },
                { label: 'PM Overdue Reminder', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', msg: '[Myncel] PM Overdue: "Quarterly generator inspection" on Generator A is 3 day(s) overdue. Schedule maintenance now. Reply STOP to opt out.' },
                { label: 'Work Order (Medium)', color: 'bg-blue-50 border-blue-200 text-blue-800', msg: '[Myncel] New MEDIUM work order WO-1043: "Inspect conveyor belt alignment" on Line 2 Conveyor. Log in to view. Reply STOP to opt out.' },
                { label: 'Low Alert', color: 'bg-green-50 border-green-200 text-green-800', msg: '[Myncel] LOW Alert: Vibration sensor reading above normal on Pump Station 4. Check your dashboard when available. Reply STOP to opt out.' },
              ].map((item, i) => (
                <div key={i} className={`rounded-lg border p-4 ${item.color}`}>
                  <p className="text-xs font-semibold mb-1 opacity-70">{item.label}</p>
                  <p className="text-sm font-mono">{item.msg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Opt-Out Instructions */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">🛑 How to Opt Out</h2>
            <p className="text-[#425466] mb-4">Users can opt out of SMS notifications at any time using any of the following methods:</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '📱', title: 'Reply STOP', desc: 'Reply STOP to any Myncel SMS message. You will be immediately unsubscribed and receive a confirmation.' },
                { icon: '⚙️', title: 'Account Settings', desc: 'Log in → Settings → Notifications → Toggle off SMS → Save Changes.' },
                { icon: '📧', title: 'Contact Support', desc: 'Email support@myncel.com and request removal from SMS notifications.' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <p className="font-semibold text-[#0a2540] text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-[#425466]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Help */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-4">❓ HELP Response</h2>
            <p className="text-[#425466] mb-3">If a user replies <strong>HELP</strong> to any Myncel SMS, they receive:</p>
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 font-mono text-sm text-[#425466]">
              Myncel Alerts: For help visit myncel.com/help or email support@myncel.com. Reply STOP to unsubscribe. Msg & data rates may apply.
            </div>
          </div>

          {/* Program Details */}
          <div className="rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-[#0a2540] mb-5">📊 Program Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Program Name', value: 'Myncel Operational SMS Notifications' },
                { label: 'Sender Number', value: '(844) 994-1183' },
                { label: 'Message Type', value: 'Transactional / Operational (non-marketing)' },
                { label: 'Message Frequency', value: 'Varies based on user settings and equipment events' },
                { label: 'Message & Data Rates', value: 'May apply — standard carrier rates' },
                { label: 'Supported Carriers', value: 'All major US and Canadian carriers' },
                { label: 'STOP Command', value: 'Immediately unsubscribes from all Myncel SMS' },
                { label: 'HELP Command', value: 'Returns support contact and website info' },
                { label: 'Support Email', value: 'support@myncel.com' },
                { label: 'Privacy Policy', value: 'myncel.com/privacy' },
                { label: 'Terms of Service', value: 'myncel.com/terms' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-sm font-semibold text-[#0a2540] w-40 flex-shrink-0">{item.label}:</span>
                  <span className="text-sm text-[#425466]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/privacy" className="inline-flex items-center gap-2 bg-[#f6f9fc] border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:bg-slate-100 transition-colors">
              📄 Privacy Policy
            </Link>
            <Link href="/terms" className="inline-flex items-center gap-2 bg-[#f6f9fc] border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-medium text-[#425466] hover:bg-slate-100 transition-colors">
              📋 Terms of Service
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
