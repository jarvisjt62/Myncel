export default function StatusPage() {
  const services = [
    { name: "Dashboard", status: "operational", uptime: "99.99%" },
    { name: "API Services", status: "operational", uptime: "99.99%" },
    { name: "Database", status: "operational", uptime: "99.99%" },
    { name: "Notifications", status: "operational", uptime: "99.98%" },
    { name: "File Storage", status: "operational", uptime: "99.99%" },
  ];

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse"></div>
          <h1 className="text-4xl font-bold text-[#0a2540]">All Systems Operational</h1>
        </div>
        <p className="text-[#425466] mb-8">Real-time status of Myncel services. We maintain 99.99% uptime guarantee.</p>
        
        <div className="bg-white rounded-xl border border-[#e6ebf1] overflow-hidden">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-[#e6ebf1] bg-[#f6f9fc]">
            <span className="text-xs sm:text-sm font-semibold text-[#0a2540]">Service</span>
            <span className="text-xs sm:text-sm font-semibold text-[#0a2540]">Status</span>
            <span className="text-xs sm:text-sm font-semibold text-[#0a2540] text-right">Uptime</span>
          </div>
          {services.map((service, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 border-b border-[#e6ebf1] last:border-0 items-center">
              <span className="text-xs sm:text-base text-[#0a2540] truncate">{service.name}</span>
              <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></span>
                <span className="text-emerald-600 text-xs sm:text-sm capitalize truncate">{service.status}</span>
              </span>
              <span className="text-xs sm:text-base text-[#425466] text-right">{service.uptime}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#8898aa] mt-8">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}