// pages/spin-wheel.js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getSpinPrizeList, spinWheel, spinV2 } from '../../utils/api';
import { Icon } from '@iconify/react';
import BottomNavbar from '../../components/BottomNavbar';

export default function SpinWheel() {
  const router = useRouter();
  const [prizes, setPrizes] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState({
    balance: 0,
    name: '',
    number: '',
    reff_code: '',
    spin_ticket: 0,
    total_invest: 0,
    total_withdraw: 0
  });
  const wheelRef = useRef(null);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [pointerActive, setPointerActive] = useState(false);
  const [applicationData, setApplicationData] = useState(null);

  // Define colors for the wheel segments
  const prizeColors = [ // New brand colors for the wheel
    '#9900cc', '#0058BC', '#FF6B35', '#3D85C6',
    '#d74e0f', '#00418a', '#E65C00', '#6B9ED7'
  ].sort(() => Math.random() - 0.5); // Randomize colors each load

  // Fetch prizes and user data
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = sessionStorage.getItem('token');
    const accessExpire = sessionStorage.getItem('access_expire');
    if (!token || !accessExpire) {
      router.push('/login');
      return;
    }
    const fetchSpinData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Ambil user dari localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserData(user);
        }
        // Ambil data hadiah dari API utils
        const res = await getSpinPrizeList();
        if (res && res.success && Array.isArray(res.data)) {
          // Only use active prizes
          const filtered = res.data.filter((prize) => prize.status === 'Active');
          // Calculate total chance for percentage
          const totalChance = filtered.reduce((sum, prize) => sum + (typeof prize.chance === 'number' ? prize.chance : 0), 0);
          const processedPrizes = filtered.map((prize, index) => ({
            ...prize,
            color: prizeColors[index % prizeColors.length],
            textColor: '#FFFFFF',
            name: prize.amount >= 1000 ? `Rp ${formatCurrency(prize.amount)}` : `${prize.amount} Poin`,
            chancePercent: totalChance > 0 ? ((prize.chance / totalChance) * 100) : 0
          }));
          setPrizes(processedPrizes);
        } else {
          setError('Gagal memuat hadiah spin');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Error fetching spin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpinData();
    const storedApplication = localStorage.getItem('application');
  if (storedApplication) {
    try {
      const parsed = JSON.parse(storedApplication);
      setApplicationData({
        name: parsed.name || 'CrownDana',
        healthy: parsed.healthy || false,
      });
    } catch (e) {
      setApplicationData({ name: 'CrownDana', healthy: false });
    }
  } else {
    setApplicationData({ name: 'CrownDana', healthy: false });
  }
  }, []);

  // (server-driven) frontend no longer selects prize by probability

  // Calculate the final absolute rotation (degrees) so the selected prize center aligns with top
  const calculateRotation = (prizeIndex) => {
    if (!prizes || prizes.length === 0) return 0;
    const segmentAngle = 360 / prizes.length;

    // center of the target segment in degrees (SVG coords)
    const targetCenter = (prizeIndex + 0.5) * segmentAngle;

    // desired final angle so that targetCenter sits at top (12 o'clock / 270deg SVG)
    const desiredFinal = (270 - targetCenter + 360) % 360;

    // choose full spins (5-6) for effect and add desiredFinal to get absolute rotation
    const fullSpins = (5 + Math.floor(Math.random() * 2)) * 360;
    const finalRotation = fullSpins + desiredFinal;
    return finalRotation;
  };

  const handleSpin = async () => {
    if (userData.spin_ticket < 1) {
      setError('Tidak memiliki tiket spin yang cukup');
      return;
    }

    if (prizes.length === 0) {
      setError('Data hadiah belum dimuat');
      return;
    }

    setIsSpinning(true);
    setError(null);
    setResult(null);

    try {
      // Server-driven spin: call backend to get prize (server validates tickets)
      const previousRotation = currentRotation;
      const response = await spinV2();

      if (!response || !response.success) {
        setError(response?.message || 'Spin gagal');
        // Reset on error: smoothly snap back to previous rotation
        if (wheelRef.current) {
          wheelRef.current.style.transition = 'transform 600ms ease-out';
          wheelRef.current.style.transform = `rotate(${previousRotation}deg)`;
        }
        setCurrentRotation(previousRotation);
        setIsSpinning(false);
        return;
      }

      // server returned success with spin result -> animate to server prize
      const serverPrize = response.data && response.data.spin_result ? response.data.spin_result : null;
      let serverIndex = -1;
      if (serverPrize) {
        serverIndex = prizes.findIndex(p => (p.code && serverPrize.code && p.code === serverPrize.code) || (Number(p.amount) === Number(serverPrize.amount)));
      }
      if (serverIndex === -1) serverIndex = 0; // fallback

      // animate wheel to serverIndex
      const finalRotation = calculateRotation(serverIndex);
      const baseFull = Math.floor(currentRotation / 360) * 360;
      let targetRotation = baseFull + finalRotation;
      if (targetRotation <= currentRotation) targetRotation += 360;
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.2,0.7,0.3,1)';
        wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;
      }
      await new Promise(resolve => setTimeout(resolve, 4200));
      setCurrentRotation(targetRotation);

      // briefly animate pointer and show result
      setPointerActive(true);
      setResult({
        prize: {
          amount: response.data.spin_result.amount,
          name: response.data.spin_result.amount >= 1000 ? `Rp ${formatCurrency(response.data.spin_result.amount)}` : `${response.data.spin_result.amount} Poin`
        },
        message: response.message,
        previousBalance: response.data.balance_info.previous_balance,
        currentBalance: response.data.balance_info.current_balance,
        prizeAmount: response.data.balance_info.prize_amount
      });
      setTimeout(() => setPointerActive(false), 1800);

      // Step 7: Update user data and show result
      const updatedUserData = {
        ...userData,
        balance: response.data.balance_info.current_balance,
        spin_ticket: userData.spin_ticket - 1
      };
      setUserData(updatedUserData);
      localStorage.setItem('user', JSON.stringify(updatedUserData));

    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
      // Reset on error
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform = `rotate(${currentRotation}deg)`;
      }
    } finally {
      setIsSpinning(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  // Create wheel segments with proper text alignment
  const createWheelSegments = () => {
  if (prizes.length === 0) return null;

  const segmentAngle = 360 / prizes.length;
  const radius = 120;
  const centerX = 120;
  const centerY = 120;

  return prizes.map((prize, index) => {
    const startAngleRad = (index * segmentAngle) * (Math.PI / 180);
    const endAngleRad = ((index + 1) * segmentAngle) * (Math.PI / 180);

    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    
    const textAngleRad = (startAngleRad + endAngleRad) / 2;
    const textRadius = radius * 0.7;
    const textX = centerX + textRadius * Math.cos(textAngleRad);
    const textY = centerY + textRadius * Math.sin(textAngleRad);

    // rotate text so it reads outward along the wheel
    const textAngleDeg = (textAngleRad * (180 / Math.PI)) + 90;
    return (
      <g key={index}>
        <path d={pathData} fill={prize.color} stroke="#fff" strokeWidth="2" />
        <text 
          x={textX}
          y={textY}
          fill={prize.textColor}
          fontSize="11"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="central"
          transform={`rotate(${textAngleDeg}, ${textX}, ${textY})`}
        >
          {prize.name}
        </text>
      </g>
    );
  });
};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden">
        <Head>
          <title>{applicationData?.name || 'CrownDana'} | Spin Wheel</title>
          <meta name="description" content={`${applicationData?.name || 'CrownDana'} Spin Wheel`} />
          <link rel="icon" href="/favicon.png" />
        </Head>
        <div className="stars"></div>
        <div className="stars1"></div>
        <div className="stars2"></div>
        <div className="flex flex-col items-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#9900cc]/20 border-t-[#9900cc]"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-[#9900cc]/40"></div>
          </div>
          <p className="text-white/70 text-sm mt-4">Memuat hadiah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32 relative overflow-hidden">
      <Head>
        <title>{applicationData?.name || 'CrownDana'} | Spin Wheel</title>
        <meta name="description" content={`${applicationData?.name || 'CrownDana'} Spin Wheel`} />
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Background elements */}
      <div className="stars"></div>
      <div className="stars1"></div>
      <div className="stars2"></div>
      <div className='shooting-stars'></div>
      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_85%_0%,rgba(0,88,188,0.3)_0%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_100%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_100%,rgba(153,0,204,0.4)_0%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_100%)]"></div>

      {/* Top Navigation */}
      <div className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-sm mx-auto p-4 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            <Icon icon="mdi:arrow-left" className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Spin Wheel</h1>
          <div className="w-10 h-10"></div>
        </div>
      </div>

      <div className="max-w-sm mx-auto p-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9900cc] to-[#FF6B35] flex items-center justify-center shadow-lg">
              <Icon icon="mdi:dharmachakra" className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Spin Wheel</h1>
          </div>
          <p className="text-white/60 text-sm">
              Dapatkan hadiah menarik dengan memutar roda keberuntungan!
          </p>
        </div>

        {/* User Info Section */}
        <div className="relative mb-8">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9900cc] to-[#0058BC] rounded-3xl blur opacity-20"></div>
          <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-5 border border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-xs text-white/60 mb-1">Saldo Anda</p>
                <p className="text-lg font-bold text-white">Rp {formatCurrency(userData.balance)}</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-[#9900cc]/10 to-[#FF6B35]/10 rounded-xl border border-[#9900cc]/20">
                <p className="text-xs text-white/60 mb-1">Tiket Spin</p>
                <p className="text-lg font-bold text-[#9900cc]">{userData.spin_ticket}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="relative animate-shake mb-8">
            <div className="absolute -inset-0.5 bg-red-500/50 rounded-2xl blur"></div>
            <div className="relative bg-red-500/10 border border-red-400/30 rounded-2xl p-4 flex items-start gap-3">
              <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-red-300 text-sm leading-relaxed">{error}</span>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="relative animate-fadeIn mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl blur opacity-30"></div>
            <div className="relative bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-3xl p-6 border border-green-500/20 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Icon icon="mdi:trophy" className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-bold text-white">Selamat! Anda Memenangkan</h3>
              </div>
              <div className="text-3xl font-bold text-yellow-400 mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {result.prize.name}
            </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/60 text-xs">Saldo Sebelum</p>
                  <p className="text-white font-bold">Rp {formatCurrency(result.previousBalance)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-white/60 text-xs">Saldo Sekarang</p>
                  <p className="text-white font-bold">Rp {formatCurrency(result.currentBalance)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spin Wheel Container */}
        <div className="relative mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#9900cc] to-[#0058BC] rounded-full blur-2xl opacity-30"></div>
          <div className="relative flex justify-center p-4">
            <div className="relative w-72 h-72">
              {/* Wheel SVG */}
              <svg 
                ref={wheelRef}
                className="absolute inset-0 w-full h-full drop-shadow-2xl"
                viewBox="0 0 240 240"
                style={{ 
                  transform: `rotate(${currentRotation}deg)`,
                  transition: 'transform 4s cubic-bezier(0.2, 0.7, 0.3, 1)'
                }}
              >
                {createWheelSegments()}
              </svg>
              
              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-full transform -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg border-4 border-[#9900cc]"></div>
              
              {/* Pointer (triangle pointing DOWN from top center) */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20 flex flex-col items-center pointer-events-none">
                <div className={`w-0 h-0 border-l-[16px] border-r-[16px] border-t-[24px] border-l-transparent border-r-transparent drop-shadow-lg transition-all duration-300 ${pointerActive ? 'border-t-yellow-400 scale-110' : 'border-t-[#9900cc]'}`}></div>
              </div>
            </div>
          </div>

          {/* Spin Button */}
          <button
            onClick={handleSpin}
            disabled={isSpinning || userData.spin_ticket < 1}
            className={`w-full bg-gradient-to-r from-[#9900cc] to-[#FF6B35] text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-[#9900cc]/30 mb-4 ${
              isSpinning || userData.spin_ticket < 1 ? 'opacity-50 cursor-not-allowed' : 'hover:from-[#d74e0f] hover:to-[#9900cc] hover:shadow-[#9900cc]/50 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSpinning ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Memutar...
              </>
            ) : (
              <>
                <Icon icon="mdi:rocket" className="w-6 h-6" />
                Putar Sekarang
              </>
            )}
          </button>
        </div>

        {/* Prize List */}
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
            <Icon icon="mdi:gift" className="w-6 h-6 text-[#9900cc]" />
            Daftar Hadiah
          </h2>
          <div className="grid gap-3">
            {prizes.map((prize, index) => (
              <div
                key={index}
                className="flex items-center p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3 w-full">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: prize.color }}
                  >
                    {index + 1}
                  </div>
                  <div className="text-white/80 font-medium text-sm">{prize.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Copyright dengan jarak yang cukup dari bottom navbar */}
        <div className="text-center text-white/60 text-xs flex items-center justify-center gap-2 mt-8">
          <Icon icon="solar:copyright-bold" className="w-3 h-3" />
          <span>2025 {applicationData?.company || 'Ciroos, Inc'}. All Rights Reserved.</span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="max-w-sm mx-auto">
          <BottomNavbar />
        </div>
      </div>

      <style jsx global>{`
        .stars {
  z-index: 10;
  width: 1px;
  height: 1px;
  border-radius: 50%;
  background: transparent;
  box-shadow: 718px 1689px #FFF , 1405px 2127px #FFF , 1270px 1148px #FFF , 620px 641px #FFF , 1538px 708px #FFF , 2169px 1632px #FFF , 523px 1494px #FFF , 1081px 2018px #FFF , 1372px 585px #FFF , 974px 576px #FFF , 448px 1231px #FFF , 78px 2055px #FFF , 1180px 1274px #FFF , 1752px 2099px #FFF , 1392px 488px #FFF , 1836px 2303px #FFF , 1309px 816px #FFF , 922px 962px #FFF , 1165px 2485px #FFF , 2054px 176px #FFF , 1425px 747px #FFF , 2253px 2056px #FFF , 1602px 114px #FFF , 433px 1332px #FFF , 65px 1726px #FFF , 257px 334px #FFF , 1512px 1855px #FFF , 775px 2422px #FFF , 2512px 2123px #FFF , 76px 2235px #FFF , 1979px 501px #FFF , 352px 1222px #FFF , 554px 1215px #FFF , 1200px 2163px #FFF , 2078px 1983px #FFF , 2461px 557px #FFF , 1960px 2055px #FFF , 1966px 316px #FFF , 1123px 1402px #FFF , 1461px 2288px #FFF , 1625px 2076px #FFF , 822px 609px #FFF , 531px 1358px #FFF , 900px 1938px #FFF , 1867px 1362px #FFF , 1049px 372px #FFF , 319px 980px #FFF , 2321px 2421px #FFF , 1701px 1425px #FFF , 1827px 1324px #FFF , 126px 1121px #FFF , 527px 1735px #FFF;
  animation: animStar 100s linear infinite;
}
.stars:after {
  content: " ";
  top: -600px;
  width: 1px;
  height: 1px;
  border-radius: 50%;
  position: absolute;
  backgroud: transparent;
  box-shadow: 1229px 1419px #FFF , 672px 2257px #FFF , 821px 854px #FFF , 731px 1239px #FFF , 1244px 58px #FFF , 687px 2428px #FFF , 173px 1549px #FFF , 1973px 940px #FFF , 2334px 1057px #FFF , 792px 882px #FFF , 1499px 1912px #FFF , 1892px 9px #FFF , 172px 1753px #FFF , 22px 1577px #FFF , 934px 2059px #FFF , 1398px 2309px #FFF , 100px 77px #FFF , 1545px 22px #FFF , 595px 1917px #FFF , 941px 1452px #FFF , 1226px 1022px #FFF , 1254px 990px #FFF , 2507px 352px #FFF , 111px 887px #FFF , 1666px 168px #FFF , 966px 986px #FFF , 121px 2559px #FFF , 1424px 792px #FFF , 1973px 2544px #FFF , 577px 503px #FFF , 1167px 1107px #FFF , 2397px 1653px #FFF , 1054px 810px #FFF , 663px 805px #FFF , 1084px 317px #FFF , 2214px 759px #FFF , 190px 975px #FFF , 2218px 2104px #FFF , 2013px 1227px #FFF , 383px 1778px #FFF , 1287px 1660px #FFF , 2131px 994px #FFF , 1073px 748px #FFF , 1745px 2372px #FFF , 1424px 252px #FFF , 1274px 2457px #FFF , 1976px 2422px #FFF , 1644px 1665px #FFF , 2372px 1772px #FFF , 1593px 580px #FFF , 894px 2361px #FFF , 31px 1802px #FFF , 1552px 1134px #FFF , 1477px 1847px #FFF , 1647px 2464px #FFF , 599px 510px #FFF , 2016px 226px #FFF , 1402px 243px #FFF , 748px 953px #FFF , 387px 1212px #FFF , 453px 1525px #FFF , 1032px 93px #FFF , 1420px 1399px #FFF , 146px 948px #FFF , 2256px 1631px #FFF , 1405px 394px #FFF , 201px 2149px #FFF , 1077px 1765px #FFF , 34px 2213px #FFF , 2388px 246px #FFF , 392px 667px #FFF , 1595px 181px #FFF , 323px 426px #FFF , 2405px 2410px #FFF , 2484px 280px #FFF;
}

.stars1 {
  z-index: 10;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: transparent;
  box-shadow: 452px 2369px #FFF , 2030px 2013px #FFF , 113px 1775px #FFF , 426px 2228px #FFF , 735px 2395px #FFF , 483px 147px #FFF , 1123px 1666px #FFF , 1944px 113px #FFF , 1096px 372px #FFF , 2005px 118px #FFF , 1948px 2320px #FFF , 2095px 823px #FFF , 742px 1559px #FFF , 1637px 383px #FFF , 877px 992px #FFF , 141px 1522px #FFF , 483px 941px #FFF , 2028px 761px #FFF , 1164px 2482px #FFF , 692px 1202px #FFF , 1008px 62px #FFF , 1820px 2535px #FFF , 1459px 2067px #FFF , 519px 1297px #FFF , 1620px 252px #FFF , 1014px 1855px #FFF , 679px 135px #FFF , 1927px 2544px #FFF , 836px 1433px #FFF , 286px 21px #FFF , 1131px 769px #FFF , 1717px 1031px #FFF , 2121px 517px #FFF , 1865px 1257px #FFF , 1640px 1712px #FFF , 158px 162px #FFF , 2491px 1514px #FFF , 784px 1446px #FFF , 1547px 968px #FFF , 1966px 1461px #FFF , 923px 1883px #FFF , 601px 81px #FFF , 1486px 598px #FFF , 1947px 1462px #FFF , 2161px 1181px #FFF , 773px 675px #FFF , 2023px 455px #FFF , 1199px 1199px #FFF , 94px 1814px #FFF , 1055px 852px #FFF , 583px 631px #FFF , 150px 1931px #FFF , 1472px 597px #FFF , 611px 1338px #FFF , 54px 859px #FFF , 1266px 1019px #FFF , 1028px 256px #FFF , 1442px 964px #FFF , 436px 1325px #FFF , 2446px 1141px #FFF , 723px 70px #FFF , 825px 964px #FFF , 63px 271px #FFF , 647px 849px #FFF , 309px 673px #FFF , 1965px 2090px #FFF , 1672px 9px #FFF , 450px 2504px #FFF , 1675px 2135px #FFF , 2075px 921px #FFF , 1607px 2348px #FFF , 2243px 1494px #FFF;
  animation: animStar 125s linear infinite;
}
.stars1:after {
  content: " ";
  top: -600px;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  position: absolute;
  backgroud: transparent;
  box-shadow: 435px 1410px #FFF , 1717px 2554px #FFF , 885px 1458px #FFF , 1614px 909px #FFF , 26px 2169px #FFF , 1627px 1343px #FFF , 511px 518px #FFF , 1388px 722px #FFF , 748px 1982px #FFF , 837px 2188px #FFF , 891px 1897px #FFF , 917px 2547px #FFF , 866px 2021px #FFF , 1748px 2464px #FFF , 409px 2476px #FFF , 1321px 1824px #FFF , 1946px 1620px #FFF , 84px 1996px #FFF , 773px 475px #FFF , 2327px 1356px #FFF , 181px 38px #FFF , 2122px 1291px #FFF , 2254px 375px #FFF , 654px 432px #FFF , 2022px 710px #FFF , 866px 1651px #FFF , 948px 2128px #FFF , 1107px 1282px #FFF , 1605px 1555px #FFF , 847px 2056px #FFF , 1678px 385px #FFF , 1723px 2282px #FFF , 516px 166px #FFF , 1764px 93px #FFF , 1947px 2302px #FFF , 1357px 1486px #FFF , 1237px 2532px #FFF , 2338px 2002px #FFF , 251px 1525px #FFF , 876px 1121px #FFF , 189px 759px #FFF , 1936px 1574px #FFF , 2510px 1440px #FFF , 204px 836px #FFF , 2044px 437px #FFF , 471px 45px #FFF , 394px 548px #FFF , 1730px 641px #FFF , 1526px 1701px #FFF , 1559px 1106px #FFF , 1396px 1826px #FFF , 1106px 644px #FFF , 160px 2149px #FFF , 1261px 1804px #FFF , 363px 714px #FFF , 2002px 2277px #FFF , 696px 1741px #FFF , 2291px 499px #FFF , 2089px 2229px #FFF;
}

.stars2 {
  z-index: 10;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: transparent;
  box-shadow: 380px 1043px #FFF , 10px 1086px #FFF , 660px 1062px #FFF , 1371px 842px #FFF , 1290px 2153px #FFF , 2258px 231px #FFF , 2130px 2217px #FFF , 1084px 758px #FFF , 1464px 1903px #FFF , 621px 2482px #FFF , 2470px 754px #FFF , 1282px 1797px #FFF , 510px 1678px #FFF , 836px 799px #FFF , 2001px 134px #FFF , 2314px 1869px #FFF , 1031px 643px #FFF , 949px 292px #FFF , 16px 2265px #FFF , 465px 1239px #FFF , 2117px 1952px #FFF , 1683px 605px #FFF , 1818px 1945px #FFF , 890px 1749px #FFF , 324px 110px #FFF , 1048px 1442px #FFF , 2399px 1553px #FFF , 157px 551px #FFF , 666px 314px #FFF , 897px 933px #FFF , 2397px 438px #FFF , 1280px 988px #FFF , 1510px 2373px #FFF , 2453px 1645px #FFF , 831px 994px #FFF , 2125px 338px #FFF , 1571px 2128px #FFF , 1792px 53px #FFF , 820px 2480px #FFF , 529px 1544px #FFF , 1941px 928px #FFF , 1632px 795px #FFF , 152px 993px #FFF , 1040px 260px #FFF , 1131px 589px #FFF , 2395px 1336px #FFF , 1537px 1906px #FFF , 1989px 1910px #FFF , 1489px 1098px #FFF , 996px 1585px #FFF , 476px 69px #FFF , 123px 466px #FFF , 374px 414px #FFF , 741px 1097px #FFF , 1415px 1296px #FFF , 945px 1132px #FFF , 909px 2080px #FFF , 2219px 8px #FFF , 2198px 1039px #FFF , 1794px 1513px #FFF , 1484px 1972px #FFF , 1557px 2099px #FFF , 1385px 912px #FFF , 1612px 1474px #FFF , 169px 1963px #FFF;
  animation: animStar 175s linear infinite;
}
.stars2:after {
  content: " ";
  top: -600px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  position: absolute;
  backgroud: transparent;
  box-shadow: 148px 2112px #FFF , 2328px 2246px #FFF , 793px 1150px #FFF , 2476px 867px #FFF , 195px 2295px #FFF , 721px 1158px #FFF , 344px 1096px #FFF , 1434px 1247px #FFF , 2251px 1334px #FFF , 1696px 1404px #FFF , 1928px 1929px #FFF , 473px 1718px #FFF , 1176px 1364px #FFF , 133px 1990px #FFF , 1396px 1179px #FFF , 1355px 1046px #FFF , 676px 869px #FFF , 2255px 1676px #FFF , 2393px 2105px #FFF , 1032px 1390px #FFF , 773px 2159px #FFF , 1235px 945px #FFF , 1161px 209px #FFF , 1878px 175px #FFF , 287px 1787px #FFF , 509px 935px #FFF , 473px 442px #FFF , 1864px 177px #FFF , 768px 2004px #FFF , 513px 744px #FFF , 2060px 2271px #FFF , 2187px 2135px #FFF , 1818px 505px #FFF , 809px 1998px #FFF , 323px 2553px #FFF , 1420px 167px #FFF , 2418px 2233px #FFF , 1955px 2053px #FFF , 1822px 145px #FFF , 931px 629px #FFF , 94px 2440px #FFF , 1816px 718px #FFF , 386px 668px #FFF , 2040px 397px #FFF , 40px 866px #FFF , 1397px 2398px #FFF , 2399px 297px #FFF , 1611px 259px #FFF , 1393px 1139px #FFF;
}

.shooting-stars {
  z-index: 1;
  width: 5px;
  height: 85px;
  border-top-left-radius: 50%;
  border-top-right-radius: 50%;
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(to top, rgba(255, 255, 255, 0), white);
  animation: animShootingStar 10s linear infinite;
}

@keyframes animStar {
  from {
    transform: translateY(0px);
  }
  to {
    transform: translateY(-2560px) translateX(-2560px);
  }
}
@keyframes animShootingStar {
  from {
    transform: translateY(0px) translateX(0px) rotate(-45deg);
    opacity: 1;
    height: 5px;
  }
  to {
    transform: translateY(-2560px) translateX(-2560px) rotate(-45deg);
    opacity: 1;
    height: 800px;
  }
}

          /* Glassmorphism card matching Ciroos style */
          .glassmorphism-card {
            background: radial-gradient(94.23% 79.86% at 50% 31.48%, rgba(243, 250, 247, 0.02) 57%, rgba(243, 250, 247, 0.10) 91.5%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }

          /* Input field styling */
        .input-field {
            background: rgba(243, 250, 247, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 0.75rem;
            transition: all 0.3s;
        }
          
        .input-field:focus-within {
            border-color: #9900cc;
            box-shadow: 0 0 0 3px rgba(244, 93, 22, 0.2);
        }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideUp {
            from { transform: translateY(40px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
          .animate-slideUp { animation: slideUp 0.5s ease-out; }
          .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}