// components/InvestmentModal.js
import { useState, useEffect } from 'react';
import { createInvestment } from '../utils/api';
import { useRouter } from 'next/router';
import { BANKS } from '../constants/products';
import { Icon } from '@iconify/react';

// Define payment methods directly in component
const PAYMENT_METHODS = [
  { value: 'QRIS', label: 'QRIS', icon: 'mdi:qrcode-scan' },
  { value: 'BANK', label: 'Bank Transfer', icon: 'mdi:bank' }
];

export default function InvestmentModal({ open, onClose, product, user, onSuccess }) {
  const router = useRouter();
  const [amount, setAmount] = useState(product?.minimum || '');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [bank, setBank] = useState(BANKS[0].code);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open || !product) return null;

  const min = product.minimum;
  const max = product.maximum;
  const percentage = product.percentage;
  const duration = product.duration;

  const totalReturn = amount * percentage * 2 / 100;
  
  // Payment method logic: QRIS max 10jt, above that use BANK
  const isQRISDisabled = amount > 10000000; // 10 juta
  
  // Set default payment method and bank when modal opens or amount changes
  useEffect(() => {
    if (open && product) {
      const defaultMethod = isQRISDisabled ? 'BANK' : 'QRIS';
      setPaymentMethod(defaultMethod);
      if (BANKS && BANKS.length > 0) {
        setBank(BANKS[0].code);
      }
    }
  }, [open, product?.id, isQRISDisabled]);
  
  const handlePaymentMethodClick = (methodValue) => {
    if (loading) return;
    
    // Check if QRIS is disabled and user tries to click it
    if (methodValue === 'QRIS' && isQRISDisabled) return;
    
    // Set payment method
    setPaymentMethod(methodValue);
  };

  const formatCurrency = (amt) => new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(amt);

  const handleConfirm = async () => {
    setError('');
    if (!amount || isNaN(amount) || amount < min || amount > max) {
      setError(`Nominal investasi harus antara ${formatCurrency(min)} dan ${formatCurrency(max)}`);
      return;
    }
    if (paymentMethod === 'BANK' && !bank) {
      setError('Pilih bank transfer.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        product_id: product.id,
        amount: parseInt(amount),
        payment_method: paymentMethod,
        payment_channel: paymentMethod === 'BANK' ? bank : undefined,
      };
      const data = await createInvestment(payload);
      setLoading(false);
      if (data && data.data && data.data.order_id) {
        router.push(`/payment?order_id=${encodeURIComponent(data.data.order_id)}`);
      } else {
        setError('Gagal mendapatkan order ID pembayaran');
      }
    } catch (err) {
      setError(err.message || 'Gagal melakukan investasi');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative max-w-md w-full animate-slideUp">
        {/* Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#9900cc] via-[#FF6B35] to-[#0058BC] rounded-3xl blur-xl opacity-40"></div>
        
        {/* Main Card */}
        <div className="relative bg-gradient-to-br from-[#1A1A1A] via-[#0F0F0F] to-[#1A1A1A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          >
            <Icon icon="mdi:close" className="w-5 h-5 text-white" />
          </button>

          {/* Header with Gradient */}
          <div className="relative p-4 pb-4 bg-gradient-to-br from-[#9900cc]/10 to-[#0058BC]/10 border-b border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9900cc] to-[#FF6B35] flex items-center justify-center shadow-lg">
                <Icon icon="mdi:trending-up" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{product.name}</h2>
                <p className="text-xs text-white/60">Konfirmasi Investasi</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5 text-white/70">
                <Icon icon="mdi:arrow-down-circle" className="w-3.5 h-3.5 text-[#9900cc]" />
                <span>Min: {formatCurrency(min)}</span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <div className="flex items-center gap-1.5 text-white/70">
                <Icon icon="mdi:arrow-up-circle" className="w-3.5 h-3.5 text-[#0058BC]" />
                <span>Max: {formatCurrency(max)}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Investment Amount Input */}
            <div>
              <label htmlFor="amount" className="block text-white text-xs font-semibold mb-2 flex items-center gap-2">
                <Icon icon="mdi:cash-multiple" className="w-3.5 h-3.5 text-[#9900cc]" />
                Nominal Investasi
              </label>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#9900cc]/20 to-[#0058BC]/20 rounded-xl blur-sm opacity-50"></div>
                <div className="relative flex items-center bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-all duration-300 focus-within:border-[#9900cc] focus-within:shadow-[0_0_20px_rgba(244,93,22,0.2)]">
                  <div className="flex items-center justify-center w-12 bg-gradient-to-br from-[#9900cc]/20 to-[#FF6B35]/20 h-full border-r border-white/10">
                    <span className="text-white/90 text-xs font-bold">IDR</span>
                  </div>
                  <input
                    type="number"
                    id="amount"
                    min={min}
                    max={max}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="flex-1 bg-transparent outline-none py-2.5 px-3 text-white placeholder-white/40 text-sm font-semibold"
                    placeholder="Masukkan nominal"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Investment Summary - New Card Style */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9900cc]/30 to-[#0058BC]/30 rounded-xl blur opacity-50"></div>
              <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:chart-line-variant" className="w-4 h-4 text-[#9900cc]" />
                  <h3 className="text-white font-bold text-sm">Ringkasan Investasi</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-white/70 text-xs flex items-center gap-2">
                      <Icon icon="mdi:cash" className="w-3.5 h-3.5 text-white/50" />
                      Nominal
                    </span>
                    <span className="text-white font-bold text-sm">{formatCurrency(amount || 0)}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-gradient-to-br from-[#9900cc]/10 to-[#FF6B35]/10 rounded-lg border border-[#9900cc]/20">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Icon icon="mdi:calendar-today" className="w-3 h-3 text-[#9900cc]" />
                        <p className="text-[9px] text-white/70 font-medium uppercase tracking-wide">Harian</p>
                      </div>
                      <p className="text-sm font-bold text-[#9900cc]">{Math.ceil((percentage * 2) / duration)}%</p>
                    </div>
                    
                    <div className="p-2 bg-gradient-to-br from-[#0058BC]/10 to-[#9900cc]/10 rounded-lg border border-[#0058BC]/20">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Icon icon="mdi:chart-arc" className="w-3 h-3 text-[#0058BC]" />
                        <p className="text-[9px] text-white/70 font-medium uppercase tracking-wide">Total</p>
                      </div>
                      <p className="text-sm font-bold text-[#0058BC]">{percentage * 2}%</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold flex items-center gap-1.5 text-sm">
                        <Icon icon="mdi:trophy" className="w-4 h-4 text-[#9900cc]" />
                        Total Kembali
                      </span>
                      <span className="text-white font-bold text-base bg-gradient-to-r from-[#9900cc] to-[#FF6B35] bg-clip-text text-transparent">
                        {formatCurrency(totalReturn)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-white text-xs font-semibold mb-2 flex items-center gap-2">
                <Icon icon="mdi:credit-card" className="w-3.5 h-3.5 text-[#9900cc]" />
                Metode Pembayaran
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const isDisabled = method.value === 'QRIS' && isQRISDisabled;
                  const isSelected = paymentMethod === method.value;
                  
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => handlePaymentMethodClick(method.value)}
                      disabled={loading || isDisabled}
                      className={`
                        p-2.5 rounded-lg border transition-all duration-300 flex flex-col items-center gap-1.5
                        ${isSelected
                          ? 'bg-gradient-to-br from-[#9900cc]/20 to-[#FF6B35]/20 border-[#9900cc] shadow-lg shadow-[#9900cc]/20'
                          : isDisabled
                            ? 'bg-white/5 border-white/10 opacity-30 cursor-not-allowed'
                            : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 cursor-pointer'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <Icon 
                        icon={method.icon} 
                        className={`w-6 h-6 ${isSelected ? 'text-[#9900cc]' : isDisabled ? 'text-white/30' : 'text-white/70'}`} 
                      />
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : isDisabled ? 'text-white/30' : 'text-white/70'}`}>
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'BANK' && BANKS && BANKS.length > 0 && (
                <div className="relative mt-2">
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    disabled={loading}
                    className="relative w-full bg-white/5 border border-white/20 rounded-lg py-2 px-3 text-white text-xs font-medium outline-none focus:border-[#9900cc] focus:shadow-[0_0_20px_rgba(244,93,22,0.2)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 10px center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '14px'
                    }}
                  >
                    {BANKS.map((b) => (
                      <option key={b.code} value={b.code} style={{ backgroundColor: '#1A1A1A', color: 'white' }}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* QRIS Limit Warning */}
              {isQRISDisabled && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2 flex items-start gap-2 mt-2">
                  <Icon icon="mdi:alert-circle" className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] text-orange-200 leading-relaxed">
                    <span className="font-semibold">Limit QRIS:</span> Transaksi di atas Rp 10.000.000 harus menggunakan Bank Transfer
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="relative animate-shake">
                <div className="absolute -inset-0.5 bg-red-500/50 rounded-lg blur"></div>
                <div className="relative bg-red-500/10 border border-red-400/30 rounded-lg p-2.5 flex items-start gap-2">
                  <Icon icon="mdi:alert-circle" className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-red-300 text-xs leading-relaxed">{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-white/5 hover:bg-white/10 disabled:bg-white/5 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-300 border border-white/10 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                Batal
              </button>
              
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#9900cc] to-[#FF6B35] rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#9900cc]/50"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#d74e0f] to-[#9900cc] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-300 flex items-center justify-center gap-2 group-disabled:opacity-60 group-disabled:cursor-not-allowed">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:check-circle" className="w-4 h-4" />
                      Konfirmasi
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            transform: translateY(30px) scale(0.95); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        
        .animate-fadeIn { 
          animation: fadeIn 0.3s ease-out; 
        }
        
        .animate-slideUp { 
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
        }
        
        .animate-shake { 
          animation: shake 0.5s ease-in-out; 
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}