import React, { useState, useEffect } from 'react';
import {
  exportBackupData,
} from '../services/storage';
import {
  getGoogleClientId,
  setGoogleClientId,
  getSavedGoogleAccount,
  requestGoogleLogin,
  uploadBackupToGoogleDrive,
  downloadLatestBackupFromGoogleDrive,
  syncWithGoogleDrive,
  disconnectGoogleAccount,
  getLastAutoSyncTime,
  triggerAutoSyncToGoogleDrive,
} from '../services/googleAuth';
import {
  User,
  Activity,
  Calendar,
  Edit2,
  Clock,
  Check,
  Home,
  Dumbbell,
  Sparkles,
  Plus,
  Target,
  ChevronRight,
  Flame,
  X,
  ShieldCheck,
  Cloud,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Settings,
  RefreshCw,
  DownloadCloud,
  UploadCloud,
} from 'lucide-react';


const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GoogleDriveIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
    <path fill="#FFC107" d="M7.74 3.5 12 10.9 4.26 10.9 0 3.5z" />
    <path fill="#0066DA" d="M16.26 3.5 12 10.9l7.74 0L24 3.5z" />
    <path fill="#00AC47" d="m19.74 16.9-4.24-7.3-7.74 0 4.24 7.3z" />
    <path fill="#EA4335" d="m16.26 21 4.24-7.3-4.24-7.3-4.24 7.3z" />
    <path fill="#00832D" d="M0 16.9 4.26 9.6l7.74 0-4.26 7.3z" />
    <path fill="#2684FC" d="M7.74 21 12 13.7 4.26 13.7 0 21z" />
  </svg>
);

export default function ProfileView({
  profile,
  profiles = [],
  onUpdateProfile,
  onCreateProfile,
  onSwitchProfile,
  onDeleteProfile,
  history = [],
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null); // { type: 'success' | 'error', message: string }
  const [isExporting, setIsExporting] = useState(false);
  const [googleAccount, setGoogleAccount] = useState(() => getSavedGoogleAccount());
  const [isGoogleConnecting, setIsGoogleConnecting] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => getLastAutoSyncTime());

  useEffect(() => {
    const handleSyncUpdate = (e) => {
      setLastSyncTime(e.detail?.time || getLastAutoSyncTime());
    };
    window.addEventListener('fit_autosync_updated', handleSyncUpdate);
    return () => window.removeEventListener('fit_autosync_updated', handleSyncUpdate);
  }, []);

  const handleOfficialGoogleLogin = async () => {
    setIsGoogleConnecting(true);
    setBackupStatus(null);
    try {
      const res = await requestGoogleLogin();
      if (res.missingClientId) {
        setBackupStatus({
          type: 'error',
          message: 'Configuração do Google Client ID em falta.',
        });
        setIsGoogleConnecting(false);
        return null;
      }
      if (res.success && res.user) {
        setGoogleAccount(res.user);
        setBackupStatus({
          type: 'success',
          message: `Sessão iniciada como ${res.user.name}! A sincronizar dados com o Google Drive...`,
        });
        // Sincronização inicial automática imediata
        handleSyncWithDrive(res.user);
        return res.user;
      }
      return null;
    } catch (err) {
      console.error('Erro no Google Sign-In:', err);
      setBackupStatus({
        type: 'error',
        message: err.message || 'Não foi possível concluir o login na Google. Podes tentar novamente.',
      });
      return null;
    } finally {
      setIsGoogleConnecting(false);
    }
  };

  const isTokenExpired = Boolean(
    googleAccount?.expiresAt && Date.now() > googleAccount.expiresAt
  );

  const handleSyncWithDrive = async (forcedAccount = null) => {
    let account = forcedAccount || googleAccount;
    const tokenIsExpired = !account?.token || (account.expiresAt && Date.now() > account.expiresAt);

    // Se a sessão expirou ou não existe, renovar com login oficial
    if (tokenIsExpired) {
      account = await handleOfficialGoogleLogin();
      if (!account?.token) return;
    }

    setIsExporting(true);
    setBackupStatus({
      type: 'info',
      message: 'A sincronizar dados com o Google Drive (a descarregar e atualizar treinos)...',
    });

    try {
      const res = await syncWithGoogleDrive(account.token);
      const nowTime = res.timeString || new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowTime);

      const msg = res.newItemsMerged > 0
        ? `Sincronização concluída com sucesso às ${nowTime}! (${res.newItemsMerged} novo(s) treino(s) restaurados do Drive 🎉)`
        : `Sincronizado com o Google Drive com sucesso às ${nowTime}! Todos os treinos e pesos estão 100% atualizados.`;

      setBackupStatus({
        type: 'success',
        message: msg,
      });
    } catch (err) {
      console.error('Erro na sincronização:', err);
      if (err.isAuthError || err.message?.includes('UNAUTHENTICATED') || err.message?.includes('credential') || err.message?.includes('401')) {
        setBackupStatus({
          type: 'error',
          message: 'A sessão da Google expirou. Clica em "Renovar Sessão" para voltar a ligar.',
        });
      } else {
        setBackupStatus({
          type: 'error',
          message: err.message || 'Erro ao comunicar com o Google Drive. Tenta novamente.',
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    let account = googleAccount;
    const tokenIsExpired = !account?.token || (account.expiresAt && Date.now() > account.expiresAt);

    if (tokenIsExpired) {
      account = await handleOfficialGoogleLogin();
      if (!account?.token) return;
    }

    setIsExporting(true);
    setBackupStatus({
      type: 'info',
      message: 'A descarregar cópia de segurança do Google Drive...',
    });

    try {
      const driveRes = await downloadLatestBackupFromGoogleDrive(account.token);
      if (!driveRes.found || !driveRes.backupData) {
        setBackupStatus({
          type: 'error',
          message: 'Nenhuma cópia de segurança encontrada nesta conta Google.',
        });
        return;
      }

      const { importBackupData } = await import('../services/storage');
      const res = importBackupData(driveRes.backupData);

      window.dispatchEvent(new CustomEvent('fit_data_synchronized', { detail: { count: res.count } }));

      setBackupStatus({
        type: 'success',
        message: `Cópia restaurada com sucesso do Google Drive! (${res.count} registos recuperados 🎉)`,
      });
    } catch (err) {
      console.error('Erro restore drive:', err);
      if (err.isAuthError) {
        setBackupStatus({
          type: 'error',
          message: 'A sessão da Google expirou. Clica em "Renovar Sessão" para reautenticar.',
        });
      } else {
        setBackupStatus({
          type: 'error',
          message: err.message || 'Falha ao restaurar cópia do Google Drive.',
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToDriveApi = async () => {
    handleSyncWithDrive();
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleAccount();
    setGoogleAccount(null);
    setLastSyncTime(null);
    setBackupStatus({
      type: 'success',
      message: 'Sessão Google terminada com sucesso.',
    });
  };

  const handleSaveClientId = () => {
    const trimmed = (clientIdInput || '').trim();
    setGoogleClientId(trimmed);
    setShowClientIdModal(false);
    if (trimmed) {
      setBackupStatus({
        type: 'success',
        message: 'Google Client ID configurado com sucesso! Clica no botão para iniciar sessão.',
      });
      // Tentar login logo em seguida
      setTimeout(() => {
        handleOfficialGoogleLogin();
      }, 300);
    }
  };

  // Edit form state
  const [formData, setFormData] = useState({
    nome: profile.nome || 'Rita',
    peso: profile.peso || 58.0,
    massaMuscular: profile.massaMuscular || 40.4,
    altura: profile.altura || 1.60,
    objetivo: profile.objetivo || 'Força, Condicionamento Geral & Resistência',
    ondeTreina: profile.ondeTreina || 'both', // 'both' | 'home' | 'gym'
    diasSemanaAlvo: profile.diasSemanaAlvo || 4,
    nivel: profile.nivel || 'Intermédio',
  });

  const popularObjectives = [
    { label: '⚡ Perda de Gordura & Tonificação', text: 'Perda de Gordura & Tonificação Muscular' },
    { label: '💪 Força & Condição Geral', text: 'Força, Condicionamento Geral & Resistência' },
    { label: '🧘‍♀️ Pilates, Postura & Core', text: 'Pilates, Postura, Mobilidade & Core' },
    { label: '✨ Tonificação & Definição', text: 'Tonificação & Definição Muscular' },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      ...formData,
      peso: parseFloat(formData.peso) || profile.peso,
      massaMuscular: parseFloat(formData.massaMuscular) || profile.massaMuscular,
      altura: parseFloat(formData.altura) || profile.altura,
      diasSemanaAlvo: parseInt(formData.diasSemanaAlvo) || profile.diasSemanaAlvo,
    });
    setIsEditing(false);
  };

  const imc = (profile.peso / (profile.altura * profile.altura)).toFixed(1);
  const musclePercent = ((profile.massaMuscular / profile.peso) * 100).toFixed(1);

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  const locationLabel = (loc) => {
    if (loc === 'gym') return '🏋️‍♀️ Apenas no Ginásio (Gym)';
    if (loc === 'home') return '🏠 Apenas em Casa (Home)';
    return '✨ Ambos (Home & Gym)';
  };

  return (
    <div className="space-y-5 pb-28 animate-fade-in">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-roseGold-500">
            A Tua Jornada
          </span>
          <h1 className="text-2xl font-extrabold text-sand-500 tracking-tight">
            O Meu Perfil
          </h1>
          <p className="text-xs text-sand-400 mt-0.5">
            Preferências de treino, objetivos e estatísticas
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-3 rounded-2xl bg-white border border-sand-200 text-sand-500 hover:text-sand-700 hover:bg-cream-100 shadow-soft transition active:scale-95 relative flex items-center justify-center shrink-0"
          title="Definições da Aplicação & Nuvem"
          aria-label="Definições da Aplicação & Nuvem"
        >
          <Settings className="w-5 h-5 text-sand-500" />
          {googleAccount && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          )}
        </button>
      </div>

      {/* Multi-Profile Switcher (if more than 1 profile exists on device) */}
      {profiles && profiles.length > 1 && (
        <div className="bg-white/90 backdrop-blur rounded-2xl p-2.5 border border-sand-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sand-400 pl-1 shrink-0">
            Perfis:
          </span>
          {profiles.map((p) => {
            const isActive = p.id === profile.id;
            return (
              <div
                key={p.id}
                onClick={() => onSwitchProfile && onSwitchProfile(p.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-roseGold-400 text-white shadow-xs'
                    : 'bg-cream-100 text-sand-500 hover:bg-cream-200 border border-sand-100'
                }`}
              >
                <span>{p.nome}</span>
                {isActive && <Check className="w-3 h-3" />}
                {p.id !== 'perfil-rita' && onDeleteProfile && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Eliminar o perfil "${p.nome}"?`)) {
                        onDeleteProfile(p.id);
                      }
                    }}
                    className="ml-1 p-0.5 rounded-full hover:bg-black/20 text-current transition"
                    title="Eliminar este perfil"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-5 shadow-soft border border-sand-100 space-y-4">
        {/* User Card Top Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-roseGold-400 to-[#CF6E8E] flex items-center justify-center text-white text-xl font-black shadow-md shadow-roseGold-200">
              {profile.nome ? profile.nome.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-sand-500">{profile.nome}</h2>
                <span className="text-xs font-bold text-roseGold-600 bg-roseGold-50 px-2 py-0.5 rounded-full border border-roseGold-200">
                  {profile.nivel || 'Intermédio'}
                </span>
              </div>
              <p className="text-xs text-sand-400 leading-tight mt-0.5">{profile.objetivo}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setFormData({
                nome: profile.nome || 'Ana',
                peso: profile.peso || 58.0,
                massaMuscular: profile.massaMuscular || 40.4,
                altura: profile.altura || 1.60,
                objetivo: profile.objetivo || 'Hipertrofia & Força',
                ondeTreina: profile.ondeTreina || 'both',
                diasSemanaAlvo: profile.diasSemanaAlvo || 4,
                nivel: profile.nivel || 'Intermédio',
              });
              setIsEditing(!isEditing);
            }}
            className={`p-2.5 rounded-2xl transition ${
              isEditing
                ? 'bg-roseGold-100 text-roseGold-600'
                : 'text-sand-400 hover:text-sand-600 hover:bg-cream-100 border border-sand-200'
            }`}
            title="Editar Perfil & Perguntas"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* ── QUESTIONNAIRE EDIT FORM ── */}
        {isEditing ? (
          <form onSubmit={handleSave} className="pt-4 border-t border-sand-100 space-y-4 animate-fade-in">
            {/* Nome */}
            <div>
              <label className="text-xs font-bold text-sand-400 uppercase tracking-wider">
                Como te chamas?
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none focus:border-roseGold-400"
              />
            </div>

            {/* Onde Treinas? (Questionário) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sand-400 uppercase tracking-wider">
                Onde treinas? (Define as abas da app)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'gym', label: 'Ginásio', sub: 'Máquinas & Pesos', icon: Dumbbell },
                  { id: 'home', label: 'Em Casa', sub: 'Vídeos & Tapete', icon: Home },
                  { id: 'both', label: 'Ambos', sub: 'Casa + Ginásio', icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = formData.ondeTreina === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, ondeTreina: item.id })}
                      className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        isSel
                          ? 'bg-roseGold-50 border-roseGold-400 text-roseGold-600 shadow-sm'
                          : 'bg-cream-50 border-sand-200 text-sand-400 hover:bg-cream-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-0.5" />
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className="text-[9px] text-sand-400">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qual o teu Objetivo? (Questionário) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-sand-400 uppercase tracking-wider">
                Qual o teu objetivo principal?
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {popularObjectives.map((obj, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFormData({ ...formData, objetivo: obj.text })}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                      formData.objetivo === obj.text
                        ? 'bg-roseGold-400 text-white font-bold'
                        : 'bg-cream-100 text-sand-500 border border-sand-200 hover:bg-cream-200'
                    }`}
                  >
                    {obj.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ex: Hipertrofia & Força (Quadríceps e Glúteos)"
                value={formData.objetivo}
                onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs text-sand-500 focus:outline-none focus:border-roseGold-400 font-medium"
              />
            </div>

            {/* Dias por Semana & Nível */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-sand-400 uppercase tracking-wider">
                  Treinos por Semana
                </label>
                <div className="flex items-center gap-1 mt-1">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, diasSemanaAlvo: num })}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                        formData.diasSemanaAlvo === num
                          ? 'bg-roseGold-400 text-white shadow-xs'
                          : 'bg-cream-50 text-sand-500 border border-sand-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-sand-400 uppercase tracking-wider">
                  Nível de Experiência
                </label>
                <select
                  value={formData.nivel}
                  onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500 focus:outline-none"
                >
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermédio">Intermédio</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>
            </div>

            {/* Biometria (Peso, Massa Muscular, Altura) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <label className="text-xs font-bold text-sand-400 uppercase">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-sand-400 uppercase">Massa Musc (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.massaMuscular}
                  onChange={(e) => setFormData({ ...formData, massaMuscular: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-sand-400 uppercase">Altura (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.altura}
                  onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl bg-cream-50 border border-sand-200 text-xs font-bold text-sand-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-cream-200 text-sand-500 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-roseGold-400 hover:bg-roseGold-500 text-white text-xs font-bold shadow-md shadow-roseGold-200 transition"
              >
                Guardar Respostas
              </button>
            </div>
          </form>
        ) : (
          /* ── DISPLAY SUMMARY CARDS ── */
          <div className="space-y-3 pt-2 border-t border-sand-100">
            {/* Preferences Pill Strip */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-cream-50 rounded-2xl p-3 border border-sand-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-roseGold-100 text-roseGold-600 flex items-center justify-center shrink-0">
                  {profile.ondeTreina === 'gym' ? (
                    <Dumbbell className="w-4 h-4" />
                  ) : profile.ondeTreina === 'home' ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-[9px] font-bold text-sand-400 uppercase block">Local de Treino</span>
                  <span className="text-xs font-bold text-sand-500">
                    {profile.ondeTreina === 'gym'
                      ? 'Só Ginásio'
                      : profile.ondeTreina === 'home'
                      ? 'Só Casa'
                      : 'Casa & Ginásio'}
                  </span>
                </div>
              </div>

              <div className="bg-cream-50 rounded-2xl p-3 border border-sand-100 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-roseGold-100 text-roseGold-600 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-sand-400 uppercase block">Meta Semanal</span>
                  <span className="text-xs font-bold text-sand-500">
                    {profile.diasSemanaAlvo || 4} dias / semana
                  </span>
                </div>
              </div>
            </div>

            {/* Biometric Numbers */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-cream-50 rounded-2xl p-2.5 border border-cream-200">
                <span className="text-xs text-sand-400 block font-medium">Peso</span>
                <span className="text-base font-bold text-sand-500">{profile.peso} kg</span>
              </div>
              <div className="bg-cream-50 rounded-2xl p-2.5 border border-cream-200">
                <span className="text-xs text-sand-400 block font-medium">Massa Musc.</span>
                <span className="text-base font-bold text-sand-500">{profile.massaMuscular} kg</span>
              </div>
              <div className="bg-cream-50 rounded-2xl p-2.5 border border-cream-200">
                <span className="text-xs text-sand-400 block font-medium">Altura</span>
                <span className="text-base font-bold text-sand-500">{profile.altura} m</span>
              </div>
            </div>

            {/* Highlight Stats */}
            <div className="p-3 bg-roseGold-50/60 rounded-2xl border border-roseGold-200/50 flex items-center justify-around text-center">
              <div>
                <span className="text-xs text-roseGold-500 font-bold block uppercase">Massa Muscular</span>
                <span className="text-sm font-extrabold text-sand-500">{musclePercent}% do peso</span>
              </div>
              <div className="h-6 w-px bg-roseGold-200" />
              <div>
                <span className="text-xs text-roseGold-500 font-bold block uppercase">IMC Atual</span>
                <span className="text-sm font-extrabold text-sand-500">{imc}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast de Notificação (se houver mensagem de cópia ou auto-sync) */}
      {backupStatus && (
        <div
          className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-in shadow-soft ${
            backupStatus.type === 'success'
              ? 'bg-teal-50 border border-teal-200 text-teal-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {backupStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{backupStatus.message}</span>
          <button
            type="button"
            onClick={() => setBackupStatus(null)}
            className="text-sand-400 hover:text-sand-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── HISTÓRICO DE TREINOS DO UTILIZADOR ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-sand-500 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-roseGold-500" />
            Histórico Recente ({history.length})
          </h3>
        </div>

        {history.length === 0 ? (
          <div className="p-6 bg-white rounded-3xl border border-sand-100 text-center text-xs text-sand-400">
            Ainda não concluíste nenhum treino. Escolhe um treino no Início para começar!
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4 shadow-soft border border-sand-100 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-sand-500">{item.treinoTitulo}</h4>
                    {item.rating && (
                      <span className="text-xs font-bold text-amber-500">
                        {'★'.repeat(item.rating)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-sand-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-roseGold-400" /> {item.duracaoMinutos} min
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-500" /> {item.tipo || 'Ginásio'}
                    </span>
                  </div>
                  {item.feedback && (
                    <p className="text-xs text-sand-400 italic mt-1 bg-cream-50 px-2 py-0.5 rounded-lg border border-sand-100 inline-block">
                      "{item.feedback}"
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-medium text-sand-400 bg-cream-100 px-2.5 py-1 rounded-xl">
                    {formatDate(item.data)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* ── BRAND FOOTER ── */}
        <div className="pt-6 pb-4 text-center flex flex-col items-center justify-center opacity-70">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-roseGold-400 to-[#CF6E8E] p-1.5 flex items-center justify-center mb-1 shadow-sm">
            <img src="/logo-white.png" alt="Rise Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-bold text-sand-500 tracking-wider uppercase">Rise</span>
          <span className="text-[9px] text-sand-400">Versão 2.0 • Treino, Hábitos & AI Coach</span>
        </div>
      </div>

      {/* ── MODAL DE DEFINIÇÕES DA APLICAÇÃO & NUVEM ── */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className="bg-cream-50 w-full sm:max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-sand-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-sand-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cream-100 border border-sand-200 flex items-center justify-center text-sand-500 shadow-xs">
                  <Settings className="w-5 h-5 text-sand-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-sand-500 leading-tight">
                    Definições da Aplicação
                  </h3>
                  <p className="text-[11px] text-sand-400">
                    Cópia de segurança, nuvem e privacidade
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 rounded-2xl bg-cream-100 hover:bg-cream-200 text-sand-400 hover:text-sand-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* ── CÓPIA DE SEGURANÇA & NUVEM ── */}
              <div className="bg-white rounded-3xl p-4.5 shadow-soft border border-sand-100 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-100 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-sand-500 leading-tight">
                        Cópia de Segurança & Nuvem
                      </h4>
                      <p className="text-[11px] text-sand-400 mt-0.5 leading-snug">
                        Os teus treinos, pesos e perfil estão seguros no telemóvel e sincronizados com a nuvem.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Box: Persistent storage explanation */}
                <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-3 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                    <span className="font-bold">Armazenamento Protegido:</span> O telemóvel desligar ou ficar sem bateria <span className="font-bold underline decoration-emerald-400">não apaga os teus dados</span>. Se mudares de telemóvel, podes restaurar a cópia da Google num instante!
                  </div>
                </div>

                {/* GOOGLE CLOUD LOGIN / SYNC CARD (GIS OFICIAL) */}
                <div className={`p-4 rounded-3xl border transition ${
                  googleAccount
                    ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border-emerald-200 shadow-soft'
                    : 'bg-cream-50/70 border-sand-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-sand-200 shrink-0">
                        <GoogleIcon />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-sand-600 block">
                          {googleAccount ? 'Sessão Google Ativa' : 'Login Oficial com a Google'}
                        </span>
                        <span className="text-[10px] text-sand-400 block">
                          {googleAccount ? 'Conectado à Google Cloud & Drive' : 'Registo seguro e sincronização direta'}
                        </span>
                      </div>
                    </div>
                    {googleAccount && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        Ligada ✓
                      </span>
                    )}
                  </div>

                  {googleAccount ? (
                    <div className="space-y-3 pt-1">
                      {/* User Profile Bar */}
                      <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {googleAccount.picture ? (
                            <img
                              src={googleAccount.picture}
                              alt={googleAccount.name}
                              className="w-7 h-7 rounded-full object-cover border border-emerald-300 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {googleAccount.name ? googleAccount.name.charAt(0).toUpperCase() : 'G'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-sand-600 truncate">{googleAccount.name}</p>
                            <p className="text-[10px] text-sand-400 truncate">{googleAccount.email}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDisconnectGoogle}
                          className="text-[10px] font-bold text-sand-400 hover:text-rose-500 px-2 py-1 rounded-lg hover:bg-cream-100 transition shrink-0"
                        >
                          Terminar Sessão
                        </button>
                      </div>

                      {/* Indicador de Auto-Sync / Sessão */}
                      {isTokenExpired ? (
                        <div className="flex items-center justify-between text-[11px] text-amber-800 bg-amber-50 px-3 py-2.5 rounded-xl border border-amber-200">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Sessão expirada (Google)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOfficialGoogleLogin()}
                            className="text-[10px] font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition"
                          >
                            Renovar Sessão ↻
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] text-emerald-800 bg-emerald-50/90 px-3 py-2 rounded-xl border border-emerald-200">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Sincronização Automática Ativa
                          </span>
                          <span className="text-[10px] text-emerald-700 font-mono font-bold">
                            {lastSyncTime ? `Guardado às ${lastSyncTime}` : 'Ao concluir treinos'}
                          </span>
                        </div>
                      )}

                      {/* Notificação visível DENTRO do modal */}
                      {backupStatus && (
                        <div
                          className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 animate-fade-in ${
                            backupStatus.type === 'success'
                              ? 'bg-teal-50 border border-teal-200 text-teal-800'
                              : backupStatus.type === 'info'
                              ? 'bg-sky-50 border border-sky-200 text-sky-800'
                              : 'bg-rose-50 border border-rose-200 text-rose-800'
                          }`}
                        >
                          {backupStatus.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                          ) : backupStatus.type === 'info' ? (
                            <RefreshCw className="w-4 h-4 text-sky-600 shrink-0 animate-spin" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className="flex-1">{backupStatus.message}</span>
                          <button
                            type="button"
                            onClick={() => setBackupStatus(null)}
                            className="text-sand-400 hover:text-sand-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Action: Sincronização Inteligente no Google Drive */}
                      <button
                        type="button"
                        onClick={() => handleSyncWithDrive()}
                        disabled={isExporting}
                        className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center gap-2 transition active:scale-[0.98]"
                      >
                        {isExporting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <GoogleDriveIcon />
                        )}
                        <span>{isExporting ? 'A sincronizar com o Google Drive...' : 'Sincronizar no Google Drive'}</span>
                      </button>

                      {/* Ações secundárias: Restaurar Cópia do Drive */}
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleRestoreFromDrive}
                          disabled={isExporting}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-cream-100 border border-sand-200 text-sand-600 text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <DownloadCloud className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Restaurar do Drive</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSyncWithDrive()}
                          disabled={isExporting}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-cream-100 border border-sand-200 text-sand-600 text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-roseGold-500" />
                          <span>Forçar Envio</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <p className="text-[11px] text-sand-400 leading-relaxed">
                        Inicia sessão com a tua conta oficial da Google para guardares e sincronizares as cópias de segurança diretamente no teu Google Drive.
                      </p>
                      <button
                        type="button"
                        onClick={handleOfficialGoogleLogin}
                        disabled={isGoogleConnecting}
                        className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-cream-50 border border-sand-300 text-sand-600 text-xs font-bold shadow-xs flex items-center justify-center gap-2.5 transition active:scale-[0.98]"
                      >
                        <GoogleIcon />
                        <span>{isGoogleConnecting ? 'A abrir janela da Google...' : 'Fazer Login com a Google'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações da App e Políticas */}
              <div className="p-3.5 rounded-2xl bg-white border border-sand-200 space-y-2 text-center text-xs text-sand-400 shadow-xs">
                <div className="font-bold text-sand-500 text-xs">
                  Rise • Versão 2.0 (Treino & AI Coach)
                </div>
                <div className="flex items-center justify-center gap-3 text-[11px] text-sand-400">
                  <a
                    href="/privacy.html"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-roseGold-500"
                  >
                    Política de Privacidade
                  </a>
                  <span>•</span>
                  <a
                    href="/terms.html"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-roseGold-500"
                  >
                    Termos de Serviço
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
