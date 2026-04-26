export default function WebinarsPage() {
  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-[#0a2540] mb-4">Webinars</h1>
        <p className="text-[#425466] mb-8">Live training sessions and recorded webinars to help you get the most out of Myncel.</p>
        
        <div className="bg-white rounded-xl border border-[#e6ebf1] p-8 text-center">
          <div className="w-16 h-16 bg-[#635bff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#635bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#0a2540] mb-2">Coming Soon</h2>
          <p className="text-[#425466]">We're preparing live training sessions. Check back soon for the schedule!</p>
        </div>
      </div>
    </div>
  );
}