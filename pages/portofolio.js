// pages/investasi-saya.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import { getActiveInvestments } from '../utils/api';
import { Icon } from '@iconify/react';
import BottomNavbar from '../components/BottomNavbar';
import Image from 'next/image';

export default function InvestasiSaya() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState({});
  const [tabKeys, setTabKeys] = useState([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState('');
  const [applicationData, setApplicationData] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = sessionStorage.getItem('token');
    const accessExpire = sessionStorage.getItem('access_expire');
    if (!token || !accessExpire) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.name) {
      setUserData({
        name: "Tester",
        number: "882646678601",
        balance: 0,
      });
    } else {
      setUserData(user);
    }
    setLoading(false);
    const storedApplication = localStorage.getItem('application');
  if (storedApplication) {
    try {
      const parsed = JSON.parse(storedApplication);
      setApplicationData({
        name: parsed.name || 'Ciroos AI',
        healthy: parsed.healthy || false,
        // tambahkan properti lain jika diperlukan
      });
    } catch (e) {
      setApplicationData({ name: 'Ciroos AI', healthy: false });
    }
  } else {
    setApplicationData({ name: 'Ciroos AI', healthy: false });
  }
  }, [router]);

  useEffect(() => {
    setInvLoading(true);
    setInvError('');
    getActiveInvestments()
      .then(res => {
        const data = res.data || {};
        setInvestments(data);
        // Order tabs explicitly: Monitor (left), Insight (middle), Autopilot (right)
        const origKeys = Object.keys(data);
        const preferred = ['Monitor', 'Insight', 'Autopilot'];
        const keys = [
          // first include preferred keys in that exact order if they exist
          ...preferred.filter(k => origKeys.includes(k)),
          // then include any other keys that were present (preserve their original order)
          ...origKeys.filter(k => !preferred.includes(k))
        ];
        setTabKeys(keys);
        if (keys.length > 0) setActiveTab(keys[0]);
      })
      .catch(e => setInvError(e.message || 'Gagal memuat investasi aktif'))
      .finally(() => setInvLoading(false));
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID').format(amount);
  };

  const getStatusColor = (status) => {
    if (status === 'Running') return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (status === 'Completed') return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    if (status === 'Suspended') return 'bg-gradient-to-r from-red-500 to-rose-500';
    return 'bg-gradient-to-r from-gray-500 to-slate-500';
  };

  const getStarIcon = (tabName) => {
    if (tabName.includes('1')) return 'mdi:star-outline';
    if (tabName.includes('2')) return 'mdi:star-half-full';
    if (tabName.includes('3')) return 'mdi:star';
    return 'mdi:star-outline';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden">
        <div className="stars"></div>
        <div className="stars1"></div>
        <div className="stars2"></div>
                        <div className="shooting-stars"></div>

        <div className="flex flex-col items-center relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#9900cc]/20 border-t-[#9900cc]"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-[#9900cc]/40"></div>
          </div>
          <p className="text-white/70 text-sm mt-4">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-32 relative overflow-hidden">
      <Head>
        <title>{applicationData?.name || 'Ciroos AI'} | Portofolio Saya</title>
        <meta name="description" content={`${applicationData?.name || 'Ciroos AI'} Portfolio`} />
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Background elements */}
      <div className="stars"></div>
      <div className="stars1"></div>
      <div className="stars2"></div>
                      <div className="shooting-stars"></div>

      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_85%_0%,rgba(0,88,188,0.4)_0%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_100%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_100%,rgba(153,0,204,0.4)_0%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_100%)]"></div>

      {/* Top Navigation */}
      <div className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 active:scale-95"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3 mx-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9900cc] to-[#FF6B35] flex items-center justify-center">
              <Icon icon="mdi:chart-line" className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Portofolio Saya</h1>
            </div>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 relative z-10">
        {/* Header Section */}
        <div className="relative mb-6 mt-2">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9900cc] to-[#0058BC] rounded-3xl blur opacity-20"></div>
          
          <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-5 border border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9900cc] to-[#FF6B35] flex items-center justify-center shadow-lg">
                  <Icon icon="mdi:account-circle" className="text-white w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white mb-0.5">{userData?.name || 'Tester'}</h1>
                  <div className="flex items-center gap-1.5">
                    <Icon icon="mdi:phone" className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-white/70 text-xs">
                      +62{userData?.number || '882646678601'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9900cc]/20 to-[#FF6B35]/20 flex items-center justify-center">
                    <Icon icon="mdi:wallet" className="w-4 h-4 text-[#9900cc]" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/60 font-medium uppercase tracking-wide">Total Saldo</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(userData?.balance || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#0058BC]/10 flex items-center justify-center">
                <Icon icon="mdi:trending-up" className="text-[#0058BC] w-4 h-4" />
              </div>
              <span className="text-white/70 text-xs font-medium">Total Investasi</span>
            </div>
            <p className="text-white font-bold text-lg">
              {Object.values(investments).flat().length}
            </p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Icon icon="mdi:cash-multiple" className="text-green-400 w-4 h-4" />
              </div>
              <span className="text-white/70 text-xs font-medium">Total Return</span>
            </div>
            <p className="text-green-400 font-bold text-lg">
              IDR {formatCurrency(
                Object.values(investments).flat().reduce((sum, inv) => sum + inv.total_returned, 0)
              )}
            </p>
          </div>
        </div>

        {/* Tabs dinamis dari API */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-between items-center">
            {tabKeys.length === 0 ? (
              <div className="flex items-center gap-2 text-white/60 text-xs py-2">
                <Icon icon="mdi:information-outline" className="w-4 h-4" />
                <span>Tidak ada kategori investasi</span>
              </div>
            ) : (
              tabKeys.map((key, idx) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`min-w-[110px] ${idx === 1 ? 'mx-2' : ''} flex-1 px-5 py-2.5 text-sm font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 whitespace-nowrap border ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-[#9900cc] to-[#FF6B35] text-white border-transparent shadow-lg shadow-[#9900cc]/30 scale-102'
                      : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border-white/10 hover:scale-102'
                  }`}
                >
                  <Icon icon={getStarIcon(key)} className="w-5 h-5" />
                  {key}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Product List dinamis */}
        <div className="space-y-4">
          {invLoading ? (
            <div className="flex flex-col items-center justify-center my-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#9900cc]/20 border-t-[#9900cc]"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-[#9900cc]/40"></div>
              </div>
              <p className="text-white/70 text-center mt-4 text-sm">Mengambil data investasi...</p>
            </div>
          ) : invError ? (
            <div className="relative animate-shake mb-6">
              <div className="absolute -inset-0.5 bg-red-500/50 rounded-2xl blur"></div>
              <div className="relative bg-red-500/10 border border-red-400/30 rounded-2xl p-4 flex items-start gap-3">
                <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-red-300 text-sm leading-relaxed">{invError}</span>
              </div>
            </div>
          ) : !activeTab || !investments[activeTab] || investments[activeTab].length === 0 ? (
            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 text-center">
              <Icon icon="mdi:database-off" className="text-white/60 w-8 h-8 mx-auto mb-2" />
              <h3 className="text-white font-semibold">Belum Ada Investasi</h3>
              <p className="text-white/60 text-sm">Anda belum memiliki investasi di kategori {activeTab}.</p>
            </div>
          ) : (
            investments[activeTab].map((inv, index) => {
              const percent = inv.duration > 0 ? Math.round((inv.total_paid / inv.duration) * 100) : 0;
              return (
                <div key={inv.id} className="bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] rounded-3xl p-5 border border-white/10 transition-all duration-300 group">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#9900cc] to-[#FF6B35] rounded-xl flex items-center justify-center shadow-lg">
                        <Icon icon="mdi:receipt-text" className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{inv.product_name || 'Produk Investasi'}</p>
                        <p className="text-white/60 text-xs font-mono">#{inv.order_id}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>

                  {/* Investment Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon icon="mdi:wallet" className="text-[#9900cc] w-4 h-4" />
                        <span className="text-white/70 text-xs">Jumlah Investasi</span>
                      </div>
                      <span className="text-white font-semibold text-sm">IDR {formatCurrency(inv.amount)}</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon icon="mdi:cash-refund" className="text-green-400 w-4 h-4" />
                        <span className="text-white/70 text-xs">Profit Harian</span>
                      </div>
                      <span className="text-green-400 font-semibold text-sm">IDR {formatCurrency(inv.daily_profit)}</span>
                    </div>
                  </div>

                  {/* Total Profit */}
                  <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-xl p-3 mb-4 border border-green-400/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:cash-multiple" className="text-green-400 w-5 h-5" />
                        <span className="text-white/80 text-xs">Total Profit</span>
                      </div>
                      <span className="text-green-400 font-bold text-sm">IDR {formatCurrency(inv.total_returned)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-white/70 text-xs">Progress</span>
                      <span className="text-white text-xs font-semibold">{percent}%</span>
                    </div>
                    <div className="h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-[#9900cc] to-[#FF6B35] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      >
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  {inv.last_return_at && inv.next_return_at && (
                    <div className="flex justify-between text-xs text-white/60 mt-4 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                        <span>Terakhir: {new Date(inv.last_return_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:clock-fast-forward" className="w-3 h-3" />
                        <span>Berikutnya: {new Date(inv.next_return_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {/* Copyright dengan jarak yang cukup dari bottom navbar */}
        <div className="text-center text-white/60 text-xs flex items-center justify-center gap-2 mt-8">
          <Icon icon="solar:copyright-bold" className="w-3 h-3" />
          <span>2025 {applicationData?.company || 'Ciroos, Inc'}. All Rights Reserved.</span>
        </div>
      </div>

      {/* Bottom Navigation - Consistent with komisi.js */}
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