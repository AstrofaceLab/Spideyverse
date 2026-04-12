export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0F1C] flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden bg-[#060C18] border-r border-white/[0.04]">
        {/* Ambient gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full"
            style={{
              background: "radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.06) 0%, transparent 60%)"
            }}
          />
        </div>

        {/* Spider-web SVG illustration */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
            {[40, 80, 120, 160].map(r => (
              <circle key={r} cx="200" cy="200" r={r} stroke="white" strokeWidth="0.5" />
            ))}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => {
              const rad = (angle * Math.PI) / 180;
              return (
                <line key={angle}
                  x1="200" y1="200"
                  x2={200 + 170 * Math.cos(rad)}
                  y2={200 + 170 * Math.sin(rad)}
                  stroke="white" strokeWidth="0.5"
                />
              );
            })}
            <circle cx="200" cy="200" r="5" fill="#3B82F6" fillOpacity="0.8" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-auto">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="10" stroke="#3B82F6" strokeWidth="1.2" strokeOpacity="0.6"/>
              <circle cx="11" cy="11" r="6" stroke="#3B82F6" strokeWidth="1" strokeOpacity="0.4"/>
              <circle cx="11" cy="11" r="2.5" fill="#3B82F6" fillOpacity="0.9"/>
              <line x1="11" y1="1" x2="11" y2="21" stroke="#3B82F6" strokeWidth="0.8" strokeOpacity="0.25"/>
              <line x1="1" y1="11" x2="21" y2="11" stroke="#3B82F6" strokeWidth="0.8" strokeOpacity="0.25"/>
            </svg>
            <span className="font-poppins text-sm font-semibold text-[#E5ECF6] tracking-wide">SPIDEYVERSE</span>
          </div>

          {/* Tagline */}
          <div className="mt-auto">
            <p className="font-poppins text-2xl font-semibold text-[#E5ECF6] leading-snug mb-3">
              A web of connected agents for modern business execution.
            </p>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Automate growth, support, research, and operations — powered by Agent-Net.
            </p>

            {/* Social proof strip */}
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/[0.05]">
              <div className="text-center">
                <p className="font-poppins text-lg font-semibold text-[#3B82F6]">284+</p>
                <p className="text-xs text-[#64748B]">Businesses</p>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="text-center">
                <p className="font-poppins text-lg font-semibold text-[#8B5CF6]">12,847</p>
                <p className="text-xs text-[#64748B]">Drafts Generated</p>
              </div>
              <div className="w-px h-8 bg-white/[0.06]" />
              <div className="text-center">
                <p className="font-poppins text-lg font-semibold text-[#10B981]">94%</p>
                <p className="text-xs text-[#64748B]">Approval Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
