import { Home, Users, Gift, CreditCard, User } from 'lucide-react';
import { useRouter } from 'next/router';

const navItems = [
  { label: 'Home', icon: Home, href: '/dashboard', key: 'dashboard' },
  { label: 'Komisi', icon: Users, href: '/referral', key: 'referral' },
  { label: 'Bonus', icon: Gift, href: '/bonus-hub', key: 'bonus' },
  { label: 'Testimoni', icon: CreditCard, href: '/forum', key: 'forum' },
  { label: 'Profil', icon: User, href: '/profile', key: 'profile' },
];

export default function BottomNavbar() {
  const router = useRouter();
  
  return (
    <div className="w-full py-2">
      <div className="relative">
        {/* Glassmorphism Background with Brand Colors */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#9900cc]/20 via-[#0058BC]/20 to-[#9900cc]/20 rounded-2xl blur-xl"></div>
        
        <div className="relative bg-[#0A0A0A]/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl">
          <div className="grid grid-cols-5 gap-1 p-2">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = router.pathname === item.href || 
                              (item.key === 'dashboard' && router.pathname === '/') ||
                              router.pathname.startsWith(item.href);
              
              return (
                <button
                  key={item.key}
                  onClick={() => router.push(item.href)}
                  className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'text-white'
                      : 'text-[#EDE5D9]/60 hover:text-[#EDE5D9] active:scale-95'
                  }`}
                >
                  {/* Active Background Glow */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#9900cc] to-[#FF6B35] rounded-xl opacity-20 blur-sm"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#9900cc]/30 to-[#FF6B35]/30 rounded-xl"></div>
                    </>
                  )}
                  
                  {/* Icon Container */}
                  <div className={`relative z-10 transition-all duration-300 ${
                    isActive 
                      ? 'scale-110 mb-1' 
                      : 'group-hover:scale-105 mb-1'
                  }`}>
                    <IconComponent className={`w-5 h-5 transition-all duration-300 ${
                      isActive 
                        ? 'drop-shadow-[0_0_8px_rgba(244,93,22,0.6)]' 
                        : ''
                    }`} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  {/* Label */}
                  <span className={`relative z-10 text-[10px] font-medium transition-all duration-300 ${
                    isActive ? 'font-bold' : 'font-normal'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator Dot */}
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 bg-[#9900cc] rounded-full shadow-[0_0_8px_rgba(244,93,22,0.8)]"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}