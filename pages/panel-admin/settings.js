// pages/admin/settings.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Icon } from '@iconify/react';
import AdminLayout from '../../components/admin/Layout';
import useAdminAuth from '../../lib/auth/useAdminAuth';
import { adminRequest } from '../../utils/admin/api';
import Image from 'next/image';

export default function AdminSettings() {
  const { loading: authLoading } = useAdminAuth();
  const [settings, setSettings] = useState({
    name: 'Vla Devs',
    company: 'Vla Inc,',
    min_withdraw: 50000,
    max_withdraw: 10000000,
    withdraw_charge: 2.5,
    link_cs: 't.me/Vla_Devs',
    link_group: 't.me/jasasitusponzi',
    link_app: 'https://play.google.com/store/apps/details?id=com.vladevs.app',
    logo: '',
    maintenance: false,
    closed_register: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (authLoading) return;
    loadSettings();
  }, [authLoading]);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminRequest('/settings', { method: 'GET' });
      if (res && res.data) {
        setSettings({
          name: res.data.name || 'Vla Devs',
          company: res.data.company || 'Vla Inc.',
          link_app: res.data.link_app || '',
          link_cs: res.data.link_cs || '',
          link_group: res.data.link_group || '',
          logo: res.data.logo || '',
          maintenance: res.data.maintenance ?? false,
          closed_register: res.data.closed_register ?? false,
          max_withdraw: res.data.max_withdraw ?? 10000000,
          min_withdraw: res.data.min_withdraw ?? 50000,
          withdraw_charge: res.data.withdraw_charge ?? 2.5
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Gagal memuat pengaturan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Ukuran file logo maksimal 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar');
        return;
      }

      setLogo(file);
      setSettings(prev => ({ ...prev, logo: file.name }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Validate withdrawal limits
      if (Number(settings.min_withdraw) >= Number(settings.max_withdraw)) {
        setError('Minimum penarikan harus lebih kecil dari maksimum penarikan');
        setSaving(false);
        return;
      }

      const body = {
        name: settings.name,
        company: settings.company,
        link_app: settings.link_app,
        link_cs: settings.link_cs,
        link_group: settings.link_group,
        logo: settings.logo,
        maintenance: !!settings.maintenance,
        closed_register: !!settings.closed_register,
        max_withdraw: Number(settings.max_withdraw),
        min_withdraw: Number(settings.min_withdraw),
        withdraw_charge: Number(settings.withdraw_charge)
      };

      const res = await adminRequest('/settings', { 
        method: 'PUT', 
        body: JSON.stringify(body) 
      });
      
      if (res && res.success) {
        if (res.data) {
          setSettings(prev => ({ ...prev, ...res.data }));
        }
        // Show success feedback
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-lg z-50';
        successDiv.textContent = 'Pengaturan berhasil disimpan!';
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
      } else {
        setError(res?.message || 'Gagal menyimpan pengaturan');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin animation-delay-150"></div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-white font-medium text-lg">Memuat Pengaturan Sistem...</p>
            <p className="text-gray-400 text-sm mt-1">Harap tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Pengaturan Sistem">
      <Head>
        <title>Vla Devs | Pengaturan Sistem</title>
        <link rel="icon" type="image/x-icon" href="/vla-logo.png" />
      </Head>

      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-gray-600/20 to-slate-600/20 backdrop-blur-xl rounded-3xl p-6 border border-gray-500/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-slate-600 rounded-2xl flex items-center justify-center">
              <Icon icon="mdi:cog" className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Pengaturan Sistem</h1>
              <p className="text-gray-300">Konfigurasi pengaturan platform</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-2 border border-white/10 mb-8">
        <div className="flex">
          <button
            className={`flex-1 px-6 py-4 font-medium text-sm rounded-2xl transition-all duration-300 ${
              activeTab === 'general'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            onClick={() => setActiveTab('general')}
          >
            <Icon icon="mdi:cog" className="inline mr-2 w-5 h-5" />
            Pengaturan Umum
          </button>
          <button
            className={`flex-1 px-6 py-4 font-medium text-sm rounded-2xl transition-all duration-300 ${
              activeTab === 'withdrawal'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            onClick={() => setActiveTab('withdrawal')}
          >
            <Icon icon="mdi:cash-remove" className="inline mr-2 w-5 h-5" />
            Pengaturan Penarikan
          </button>
          <button
            className={`flex-1 px-6 py-4 font-medium text-sm rounded-2xl transition-all duration-300 ${
              activeTab === 'links'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            onClick={() => setActiveTab('links')}
          >
            <Icon icon="mdi:link" className="inline mr-2 w-5 h-5" />
            Link & Sosial Media
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:information" className="text-white w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Informasi Aplikasi</h2>
                  <p className="text-gray-400 text-sm">Konfigurasi identitas dan branding platform</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-gray-400 text-sm mb-4">Logo Aplikasi</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-white/20">
                      {logoPreview ? (
                        <Image src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                      ) : settings.logo ? (
                        <div className="text-center">
                          <Icon icon="mdi:image-check" className="text-green-400 w-8 h-8 mb-1" />
                          <p className="text-xs text-gray-400">Logo Tersimpan</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Icon icon="mdi:image-plus" className="text-gray-400 w-8 h-8 mb-1" />
                          <p className="text-xs text-gray-400">Upload Logo</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 inline-flex items-center gap-2">
                        <Icon icon="mdi:upload" className="w-4 h-4" />
                        Pilih Logo Baru
                        <input 
                          type="file" 
                          className="hidden" 
                          onChange={handleLogoChange} 
                          accept="image/*" 
                        />
                      </label>
                      <p className="text-gray-500 text-xs mt-2">Format: PNG, JPG, SVG. Maksimal 2MB</p>
                    </div>
                  </div>
                </div>

                {/* Site Name */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Nama Aplikasi</label>
                  <input
                    type="text"
                    name="name"
                    value={settings.name}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Masukkan nama aplikasi"
                    required
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Nama Perusahaan</label>
                  <input
                    type="text"
                    name="company"
                    value={settings.company}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Masukkan nama perusahaan"
                    required
                  />
                </div>

                {/* Maintenance & Registration Toggles */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="maintenance"
                      checked={!!settings.maintenance}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <div className="text-white font-medium">Maintenance Mode</div>
                      <div className="text-gray-400 text-sm">Aktifkan untuk menonaktifkan akses publik sementara</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="closed_register"
                      checked={!!settings.closed_register}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded"
                    />
                    <div>
                      <div className="text-white font-medium">Tutup Registrasi</div>
                      <div className="text-gray-400 text-sm">Aktifkan untuk menutup pendaftaran pengguna baru</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Settings Tab */}
        {activeTab === 'withdrawal' && (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:cash-remove" className="text-white w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Konfigurasi Penarikan</h2>
                  <p className="text-gray-400 text-sm">Atur batasan dan biaya penarikan dana</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Minimal Penarikan</label>
                  <input
                    type="number"
                    name="min_withdraw"
                    value={settings.min_withdraw}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    min="0"
                    step="1000"
                    required
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Saat ini: {formatCurrency(settings.min_withdraw)}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Maksimal Penarikan</label>
                  <input
                    type="number"
                    name="max_withdraw"
                    value={settings.max_withdraw}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    min="0"
                    step="1000"
                    required
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Saat ini: {formatCurrency(settings.max_withdraw)}
                  </p>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Biaya Admin (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="withdraw_charge"
                    value={settings.withdraw_charge}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    min="0"
                    max="100"
                    required
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    Saat ini: {settings.withdraw_charge}%
                  </p>
                </div>
              </div>

              {/* Preview Calculation */}
              <div className="mt-6 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-2xl p-4 border border-orange-500/20">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Icon icon="mdi:calculator" className="text-orange-400 w-5 h-5" />
                  Preview Perhitungan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Contoh penarikan minimal:</p>
                    <div className="flex justify-between text-white mt-1">
                      <span>Jumlah penarikan:</span>
                      <span>{formatCurrency(settings.min_withdraw)}</span>
                    </div>
                    <div className="flex justify-between text-orange-400 mt-1">
                      <span>Biaya admin ({settings.withdraw_charge}%):</span>
                      <span>-{formatCurrency((settings.min_withdraw * settings.withdraw_charge) / 100)}</span>
                    </div>
                    <div className="flex justify-between text-green-400 font-semibold mt-1 pt-1 border-t border-white/20">
                      <span>Yang diterima:</span>
                      <span>{formatCurrency(settings.min_withdraw - ((settings.min_withdraw * settings.withdraw_charge) / 100))}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400">Contoh penarikan maksimal:</p>
                    <div className="flex justify-between text-white mt-1">
                      <span>Jumlah penarikan:</span>
                      <span>{formatCurrency(settings.max_withdraw)}</span>
                    </div>
                    <div className="flex justify-between text-orange-400 mt-1">
                      <span>Biaya admin ({settings.withdraw_charge}%):</span>
                      <span>-{formatCurrency((settings.max_withdraw * settings.withdraw_charge) / 100)}</span>
                    </div>
                    <div className="flex justify-between text-green-400 font-semibold mt-1 pt-1 border-t border-white/20">
                      <span>Yang diterima:</span>
                      <span>{formatCurrency(settings.max_withdraw - ((settings.max_withdraw * settings.withdraw_charge) / 100))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Links & Social Media Tab */}
        {activeTab === 'links' && (
          <div className="space-y-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Icon icon="mdi:link" className="text-white w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Link & Sosial Media</h2>
                  <p className="text-gray-400 text-sm">Konfigurasi tautan penting dan media sosial</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Link Customer Service</label>
                  <div className="relative">
                    <Icon icon="mdi:telegram" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <input
                      type="url"
                      name="link_cs"
                      value={settings.link_cs}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="https://t.me/customerservice"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Link Group Telegram</label>
                  <div className="relative">
                    <Icon icon="mdi:telegram" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <input
                      type="url"
                      name="link_group"
                      value={settings.link_group}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="https://t.me/group"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Link Download Aplikasi</label>
                  <div className="relative">
                    <Icon icon="mdi:google-play" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
                    <input
                      type="url"
                      name="link_app"
                      value={settings.link_app}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 text-white rounded-2xl px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="https://play.google.com/store/apps/details?id=..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:alert-circle" className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-2xl font-semibold flex items-center gap-3 transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Icon icon="mdi:content-save" className="w-5 h-5" />
            )}
            {saving ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}