import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { registerUser, getInfo } from '../utils/api';
import Image from 'next/image';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    password: '',
    password_confirmation: '',
    referral_code: '',
  });
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [applicationData, setApplicationData] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [closedRegister, setClosedRegister] = useState(false);
  const [referralLocked, setReferralLocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formValidation, setFormValidation] = useState({
    name: false,
    number: false,
    password: false,
    passwordMatch: false
  });

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('token');
      const accessExpire = sessionStorage.getItem('access_expire');
      if (token && accessExpire) {
        const now = new Date();
        const expiry = new Date(accessExpire);
        if (now < expiry) {
          router.replace('/dashboard');
          return;
        }
      }
    }
    
    if (router.query && router.query.reff) {
      setFormData((prev) => ({ ...prev, referral_code: router.query.reff }));
      setReferralLocked(true);
    }

    (async () => {
      try {
        const data = await getInfo();
        if (data && data.success && data.data) {
          const app = data.data;
          if (app.name && app.company) {
            const stored = JSON.parse(localStorage.getItem('application') || '{}');
            const merged = { ...(stored || {}), name: app.name, company: app.company };
            localStorage.setItem('application', JSON.stringify(merged));
            setApplicationData(prev => ({ ...(prev || {}), name: app.name, company: app.company }));
          }
          if (app.maintenance) {
            setMaintenanceMode(true);
            setNotification({ message: 'Aplikasi sedang dalam pemeliharaan, Anda tidak dapat mendaftar. Silakan coba lagi nanti.', type: 'error' });
          }
          if (app.closed_register) {
            setClosedRegister(true);
            setNotification({ message: 'Pendaftaran sedang ditutup, Anda tidak dapat mendaftar. Silakan coba lagi nanti.', type: 'error' });
          }
        }
      } catch (err) {
        // ignore
      }
    })();
  }, [router]);

  useEffect(() => {
    setFormValidation({
      name: formData.name.trim().length >= 3,
      number: /^8[0-9]{8,11}$/.test(formData.number),
      password: formData.password.length >= 6,
      passwordMatch: formData.password === formData.password_confirmation && formData.password.length > 0
    });
    setPasswordStrength(checkPasswordStrength(formData.password));
    
    const storedApplication = localStorage.getItem('application');
    if (storedApplication) {
      try {
        const parsed = JSON.parse(storedApplication);
        setApplicationData({
          name: parsed.name || 'Vla Devs',
          healthy: parsed.healthy || false,
        });
      } catch (e) {
        setApplicationData({ name: 'Vla Devs', healthy: false });
      }
    } else {
      setApplicationData({ name: 'Vla Devs', healthy: false });
    }
  }, [formData]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'name') {
      const sanitized = value.replace(/[^A-Za-z\s]/g, '');
      setFormData((prev) => ({ ...prev, [id]: sanitized }));
      return;
    }
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleNumberChange = (e) => {
    let value = e.target.value.replace(/[^0-9+]/g, '');
    if (value.startsWith('+')) value = value.slice(1);
    if (value.startsWith('62') && value[2] === '8') {
      value = value.slice(2);
    }
    if (value.startsWith('0') && value[1] === '8') {
      value = value.slice(1);
    }
    value = value.replace(/[^0-9]/g, '');
    if (value.length > 12) value = value.slice(0, 12);
    setFormData((prev) => ({ ...prev, number: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (maintenanceMode) {
      setNotification({ message: 'Aplikasi sedang dalam pemeliharaan. Silakan coba lagi nanti.', type: 'error' });
      return;
    }
    if (closedRegister) {
      setNotification({ message: 'Pendaftaran sedang ditutup. Silakan coba lagi nanti.', type: 'error' });
      return;
    }
    
    if (formData.password !== formData.password_confirmation) {
      setNotification({ message: 'Password dan konfirmasi password tidak sama', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    setNotification({ message: '', type: '' });
    
    try {
      const result = await registerUser(formData);
      
      if (result && result.success === true) {
        const successMessage = result.message || 'Registrasi berhasil! Selamat datang.';
        setNotification({ message: successMessage, type: 'success' });
        
        setFormData({ 
          name: '', 
          number: '', 
          password: '', 
          password_confirmation: '', 
          referral_code: referralLocked ? formData.referral_code : ''
        });

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user-token-changed'));
        }
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
        
      } else if (result && result.success === false) {
        const errorMessage = result.message || 'Terjadi kesalahan. Silakan coba lagi.';
        setNotification({ message: errorMessage, type: 'error' });
      } else {
        setNotification({ message: 'Respon server tidak valid. Silakan coba lagi.', type: 'error' });
      }
      
    } catch (error) {
      console.error('Register error:', error);
      
      if (error.response) {
        const statusCode = error.response.status;
        const responseData = error.response.data;
        
        if (statusCode >= 400 && statusCode < 500) {
          const errorMessage = responseData?.message || 'Data yang dimasukkan tidak valid';
          setNotification({ message: errorMessage, type: 'error' });
        } else if (statusCode >= 500) {
          const errorMessage = responseData?.message || 'Terjadi kesalahan server. Silakan coba lagi nanti.';
          setNotification({ message: errorMessage, type: 'error' });
        } else {
          setNotification({ message: 'Terjadi kesalahan yang tidak diketahui', type: 'error' });
        }
      } else if (error.request) {
        setNotification({ message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', type: 'error' });
      } else {
        const errorMessage = error.message || 'Terjadi kesalahan. Silakan coba lagi.';
        setNotification({ message: errorMessage, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-[#9900cc]';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Sangat Lemah';
    if (passwordStrength <= 2) return 'Lemah';
    if (passwordStrength <= 3) return 'Sedang';
    if (passwordStrength <= 4) return 'Kuat';
    return 'Sangat Kuat';
  };

  const isFormValid = Object.values(formValidation).every(Boolean);

  return (
    <>
      <Head>
        <title>{applicationData?.name || 'Vla Devs'} | Register</title>
        <meta name="description" content={`${applicationData?.name || 'Vla Devs'} Description`} />
        <link rel="icon" href="/favicon.png" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden py-8">
        {/* Animated star background */}
        <div className="stars"></div>
        <div className="stars1"></div>
        <div className="stars2"></div>
        <div className="shooting-stars"></div>

        {/* Gradient overlays matching Ciroos theme */}
        <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_85%_0%,rgba(0,88,188,0.4)_0%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_100%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_100%,rgba(153,0,204,0.4)_0%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0)_100%)]"></div>

        <div className="relative z-10 w-full max-w-md p-6">
          <div className="glassmorphism-card rounded-3xl p-8 shadow-2xl animate-fadeIn">
            <div className="flex flex-col items-center mb-10">
              <div className="relative group">
                <div className="w-40 h-40 rounded-2xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 mb-0">
                  <Image
                    src="/logo_full.svg"
                    alt="CrownDana Logo"
                    className="w-full h-full object-contain relative z-10"
                    width={120}
                    height={120}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{ display: 'none' }} className="w-40 h-40 bg-gradient-to-br from-[#9900cc] to-[#0058BC] rounded-2xl flex items-center justify-center shadow-xl border border-white/10">
                    <Icon icon="mdi:alpha-c-circle" className="text-white w-24 h-24 drop-shadow-lg" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[#EDE5D9] text-sm font-medium" style={{marginTop: '-10px'}}>
                <Icon icon="mdi:shield-check" className="w-4 h-4 text-[#9900cc]" />
                <span>Secured Platform</span>
              </div>
            </div>

            {/* Header Section */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-[#FAF8F6] mb-2 flex items-center justify-center gap-3">
                <Icon icon="mdi:account-plus" className="w-6 h-6 text-[#9900cc]" />
                Daftar Akun Baru
              </h2>
              <p className="text-[#EDE5D9]/80 text-sm flex items-center justify-center gap-2">
                <Icon icon="mdi:account-circle" className="w-4 h-4" />
                Mulai perjalanan investasi Anda hari ini
              </p>
            </div>

            {/* Notification */}
            {notification.message && (
              <div className={`mb-6 px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-3 animate-shake backdrop-blur-sm border ${
                notification.type === 'success'
                  ? 'bg-[#9900cc]/20 text-[#9900cc] border-[#9900cc]/30'
                  : 'bg-red-500/20 text-red-300 border-red-400/30'
              }`}>
                <Icon 
                  icon={notification.type === 'success' ? 'mdi:check-circle' : 'mdi:alert-circle'} 
                  className="w-5 h-5 flex-shrink-0" 
                />
                <span className="flex-1">{notification.message}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 animate-slideUp">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-[#EDE5D9] text-sm font-semibold mb-2 flex items-center gap-2">
                  <Icon icon="mdi:account" className="w-4 h-4 text-[#9900cc]" />
                  Nama Lengkap
                </label>
                <div className="relative group">
                  <div className="flex items-center input-field">
                    <Icon icon="mdi:account" className="px-3 text-[#EDE5D9]/70 w-5 h-5" />
                    <input
                      type="text"
                      id="name"
                      className="flex-1 bg-transparent outline-none px-2 py-3 text-[#FAF8F6] placeholder-[#EDE5D9]/50 text-sm"
                      placeholder="Masukkan nama lengkap Anda"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                    />
                    <div className="px-3">
                      {formValidation.name ? (
                        <Icon icon="mdi:check-circle" className="w-5 h-5 text-[#9900cc]" />
                      ) : (
                        <Icon icon="mdi:account-outline" className="w-5 h-5 text-[#EDE5D9]/50" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <label htmlFor="number" className="block text-[#EDE5D9] text-sm font-semibold mb-2 flex items-center gap-2">
                  <Icon icon="mdi:phone" className="w-4 h-4 text-[#9900cc]" />
                  Nomor HP
                </label>
                <div className="relative group">
                  <div className="flex items-center input-field">
                    <div className="flex items-center shrink-0 px-4 py-3">
                      <Icon icon="flag:id-4x3" className="w-5 h-5 mr-2 shrink-0" />
                      <span className="text-[#EDE5D9] text-sm font-semibold whitespace-nowrap">+62</span>
                    </div>
                    <input
                      type="tel"
                      id="number"
                      className="flex-1 min-w-0 bg-transparent outline-none px-2 py-3 text-[#FAF8F6] placeholder-[#EDE5D9]/50 text-sm"
                      placeholder="8xxxxxxxxxxx"
                      value={formData.number}
                      onChange={handleNumberChange}
                      required
                      autoComplete="username"
                    />
                    <div className="flex items-center shrink-0 px-3">
                      {formValidation.number ? (
                        <Icon icon="mdi:check-circle" className="w-5 h-5 shrink-0 text-[#9900cc]" />
                      ) : (
                        <Icon icon="mdi:phone-outline" className="w-5 h-5 shrink-0 text-[#EDE5D9]/50" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-[#EDE5D9] text-sm font-semibold mb-2 flex items-center gap-2">
                  <Icon icon="mdi:lock" className="w-4 h-4 text-[#9900cc]" />
                  Password
                </label>
                <div className="relative group">
                  <div className="flex items-center input-field">
                    <Icon icon="mdi:lock" className="px-3 text-[#EDE5D9]/70 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className="flex-1 bg-transparent outline-none px-2 py-3 text-[#FAF8F6] placeholder-[#EDE5D9]/50 text-sm"
                      placeholder="Buat password yang kuat"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-3 text-[#EDE5D9]/70 hover:text-[#FAF8F6] transition-colors"
                    >
                      <Icon 
                        icon={showPassword ? "mdi:eye-off" : "mdi:eye"} 
                        className="w-5 h-5" 
                      />
                    </button>
                  </div>
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-600/30 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordStrength / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="text-xs text-[#EDE5D9]/70 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon 
                            icon={formData.password.length >= 6 ? "mdi:check" : "mdi:close"} 
                            className={`w-3 h-3 ${formData.password.length >= 6 ? 'text-[#9900cc]' : 'text-red-400'}`} 
                          />
                          <span>Minimal 6 karakter</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="password_confirmation" className="block text-[#EDE5D9] text-sm font-semibold mb-2 flex items-center gap-2">
                  <Icon icon="mdi:lock-check" className="w-4 h-4 text-[#9900cc]" />
                  Konfirmasi Password
                </label>
                <div className="relative group">
                  <div className="flex items-center input-field">
                    <Icon icon="mdi:lock-check" className="px-3 text-[#EDE5D9]/70 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="password_confirmation"
                      className="flex-1 bg-transparent outline-none px-2 py-3 text-[#FAF8F6] placeholder-[#EDE5D9]/50 text-sm"
                      placeholder="Ulangi password Anda"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-3 text-[#EDE5D9]/70 hover:text-[#FAF8F6] transition-colors"
                    >
                      <Icon 
                        icon={showPassword ? "mdi:eye-off" : "mdi:eye"} 
                        className="w-5 h-5" 
                      />
                    </button>
                  </div>
                  <div className="text-xs text-[#EDE5D9]/70 space-y-1">
                    {formData.password_confirmation && formData.password.length >= 6 && formData.password_confirmation !== formData.password && (
                      <div className="flex items-center gap-2 mt-2">
                        <Icon 
                          icon="mdi:close"
                          className="w-3 h-3 text-red-400" 
                        />
                        <span>Password tidak sama</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Referral Code Field */}
              <div className="space-y-2">
                <label htmlFor="referral_code" className="block text-[#EDE5D9] text-sm font-semibold mb-2 flex items-center gap-2">
                  <Icon icon="mdi:gift-outline" className="w-4 h-4 text-[#9900cc]" />
                  Kode Referral
                  <span className="text-xs text-[#EDE5D9]/50">(Opsional)</span>
                </label>
                <div className="relative group">
                  <div className={`flex items-center input-field ${referralLocked ? 'opacity-75' : ''}`}>
                    <Icon icon="mdi:gift-outline" className="px-3 text-[#EDE5D9]/70 w-5 h-5" />
                    <input
                      type="text"
                      id="referral_code"
                      className={`flex-1 bg-transparent outline-none px-2 py-3 text-[#FAF8F6] placeholder-[#EDE5D9]/50 text-sm ${referralLocked ? 'cursor-not-allowed' : ''}`}
                      placeholder="Masukkan kode referral (jika ada)"
                      value={formData.referral_code}
                      onChange={handleChange}
                      disabled={referralLocked}
                    />
                    <div className="px-3">
                      {referralLocked ? (
                        <Icon icon="mdi:lock" className="w-5 h-5 text-yellow-400" />
                      ) : formData.referral_code ? (
                        <Icon icon="mdi:gift" className="w-5 h-5 text-[#9900cc]" />
                      ) : (
                        <Icon icon="mdi:gift-outline" className="w-5 h-5 text-[#EDE5D9]/50" />
                      )}
                    </div>
                  </div>
                  {referralLocked && (
                    <div className="text-xs text-[#9900cc] mt-1 flex items-center gap-1">
                      <Icon icon="mdi:information" className="w-4 h-4" />
                      Kode referral dari link undangan, tidak dapat diubah
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg border border-white/10 relative overflow-hidden ${
                  (!maintenanceMode && !closedRegister && isFormValid)
                    ? 'bg-gradient-to-r from-[#9900cc] to-[#FF6B35] hover:from-[#7700a3] hover:to-[#9900cc] hover:shadow-[0_0_30px_rgba(153,0,204,0.4)] hover:scale-105 text-white'
                    : 'bg-gray-600/30 text-gray-400 cursor-not-allowed border-gray-600/20'
                }`}
                disabled={isLoading || !isFormValid || maintenanceMode || closedRegister}
              >
                {isLoading ? (
                  <span className="flex items-center gap-3 relative z-10">
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                    <span>Sedang Mendaftar...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-3 relative z-10">
                    <Icon icon="mdi:account-plus" className="w-5 h-5" />
                    <span>Daftar Sekarang</span>
                    <Icon icon="mdi:arrow-right-bold" className="w-5 h-5" />
                  </span>
                )}
              </button>

              {/* Form Validation Summary */}
              {!isFormValid && (
                <div className="bg-orange-500/10 border border-orange-400/30 rounded-xl p-3 text-sm">
                  <div className="flex items-center gap-2 text-orange-300 mb-2">
                    <Icon icon="mdi:alert-circle" className="w-4 h-4" />
                    <span className="font-semibold">Lengkapi formulir:</span>
                  </div>
                  <div className="space-y-1 text-orange-200 text-xs">
                    {!formValidation.name && (
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:circle-small" className="w-3 h-3" />
                        <span>Nama minimal 3 karakter</span>
                      </div>
                    )}
                    {!formValidation.number && (
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:circle-small" className="w-3 h-3" />
                        <span>Nomor HP 9-12 digit, awalan 8 (contoh: 812345678)</span>
                      </div>
                    )}
                    {!formValidation.password && (
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:circle-small" className="w-3 h-3" />
                        <span>Password minimal 6 karakter</span>
                      </div>
                    )}
                    {!formValidation.passwordMatch && formData.password_confirmation && formData.password.length >= 6 && (
                      <div className="flex items-center gap-2">
                        <Icon icon="mdi:circle-small" className="w-3 h-3" />
                        <span>Password tidak sama</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center">
              <div className="text-[#EDE5D9]/80 text-sm mb-4 flex items-center justify-center gap-2">
                <Icon icon="mdi:account-question" className="w-4 h-4" />
                Sudah punya akun?
              </div>
              <Link href="/login">
                <span className="inline-flex items-center gap-2 text-[#FAF8F6] font-semibold hover:text-[#9900cc] transition-colors duration-200 bg-[#9900cc]/10 px-5 py-2.5 rounded-xl hover:bg-[#9900cc]/20 cursor-pointer border border-[#9900cc]/20 hover:border-[#9900cc]/40">
                  <Icon icon="mdi:login" className="w-4 h-4" />
                  Login Sekarang
                  <Icon icon="mdi:arrow-right" className="w-4 h-4" />
                </span>
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-center text-[#EDE5D9]/50 text-xs flex items-center justify-center gap-2 mt-8 pt-6 border-t border-white/10">
              <Icon icon="mdi:copyright" className="w-4 h-4" />
              <span>2025 {applicationData?.company || 'Ciroos, Inc'}. All Rights Reserved.</span>
            </div>
          </div>
        </div>

        <style jsx global>{`
          /* Stars animation from Ciroos */
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
    </>
  );
}