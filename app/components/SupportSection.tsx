'use client';

export default function SupportSection() {
  const handleOpenChat = () => {
    if (typeof window !== 'undefined' && window.openMyncelChat) {
      window.openMyncelChat();
    }
  };

  return (
    <section className="py-16 bg-white border-t border-[#e6ebf1]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[#0a2540] mb-2">Still need help?</h2>
          <p className="text-[#425466]">Our support team is available Monday–Friday, 8am–6pm CT.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {/* Live Chat Button */}
          <button 
            onClick={handleOpenChat}
            className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl p-6 text-center block hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3">💬</div>
            <h3 className="font-bold text-[#0a2540] mb-2">Live Chat</h3>
            <p className="text-sm text-[#425466] mb-4">Chat with our team in real time from the app dashboard.</p>
            <span className="text-sm font-semibold text-violet-600">Open chat →</span>
          </button>
          {/* Email Support */}
          <a 
            href="mailto:support@myncel.com" 
            className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl p-6 text-center block hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3">📧</div>
            <h3 className="font-bold text-[#0a2540] mb-2">Email Support</h3>
            <p className="text-sm text-[#425466] mb-4">Send us a message and we'll reply within 4 business hours.</p>
            <span className="text-sm font-semibold text-blue-600">Email us →</span>
          </a>
          {/* Phone Support */}
          <a 
            href="tel:+18443346079" 
            className="bg-[#f6f9fc] border border-[#e6ebf1] rounded-xl p-6 text-center block hover:shadow-md transition-shadow"
          >
            <div className="text-3xl mb-3">📞</div>
            <h3 className="font-bold text-[#0a2540] mb-2">Phone Support</h3>
            <p className="text-sm text-[#425466] mb-4">Pro and Enterprise plans include direct phone support.</p>
            <span className="text-sm font-semibold text-emerald-600">Call us →</span>
          </a>
        </div>
      </div>
    </section>
  );
}