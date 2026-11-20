// ── SERVIÇO DE AUTENTICAÇÃO E GOOGLE DRIVE OFICIAL (GIS OAuth 2.0) ──

const STORAGE_KEY_GOOGLE = 'fit_google_account';
const STORAGE_KEY_CLIENT_ID = 'fit_google_client_id';

export const getGoogleClientId = () => {
  return (
    (import.meta.env ? import.meta.env.VITE_GOOGLE_CLIENT_ID : '') ||
    localStorage.getItem(STORAGE_KEY_CLIENT_ID) ||
    '1013151979499-ei0mjkgl458u9s0hmlm41hb9shdi9sfg.apps.googleusercontent.com'
  );
};

export const setGoogleClientId = (clientId) => {
  if (clientId && clientId.trim()) {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
  }
};

export const getSavedGoogleAccount = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOOGLE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Garante que o script oficial do Google Identity Services (GIS) está carregado
 */
export const ensureGoogleScriptLoaded = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.google?.accounts?.oauth2) return resolve(true);

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(!!window.google?.accounts?.oauth2));
      existing.addEventListener('error', () => resolve(false));
      if (window.google?.accounts?.oauth2) return resolve(true);
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(!!window.google?.accounts?.oauth2);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }

    setTimeout(() => {
      resolve(!!window.google?.accounts?.oauth2);
    }, 4000);
  });
};

/**
 * Inicia o fluxo oficial de login do Google (GIS Token Client)
 * Abre o popup oficial accounts.google.com
 */
export const requestGoogleLogin = async () => {
  const clientId = getGoogleClientId();

  if (!clientId) {
    return {
      success: false,
      missingClientId: true,
      message: 'É necessário configurar um Google Client ID oficial.',
    };
  }

  const isLoaded = await ensureGoogleScriptLoaded();
  if (!isLoaded || !window.google?.accounts?.oauth2) {
    throw new Error('A biblioteca oficial do Google ainda está a carregar. Tenta novamente dentro de momentos.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    // Timeout de 60 segundos para repor o botão caso o popup seja ignorado ou fechado
    const safetyTimeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('A janela da Google foi fechada ou expirou. Tenta novamente.'));
      }
    }, 60000);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        prompt: 'select_account',
        error_callback: (err) => {
          if (!settled) {
            settled = true;
            clearTimeout(safetyTimeout);
            console.warn('Google OAuth popup erro ou cancelamento:', err);
            reject(new Error(err?.message || 'A autenticação com a Google foi cancelada.'));
          }
        },
        callback: async (tokenResponse) => {
          if (settled) return;
          settled = true;
          clearTimeout(safetyTimeout);

          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = parseInt(tokenResponse.expires_in, 10) || 3600;

          try {
            // Obter dados reais do perfil Google (Nome, Email, Foto)
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!userInfoRes.ok) {
              throw new Error('Falha ao obter informações do perfil Google.');
            }

            const userInfo = await userInfoRes.json();

            const googleUser = {
              name: userInfo.name || 'Utilizador Google',
              email: userInfo.email,
              picture: userInfo.picture,
              token: accessToken,
              expiresAt: Date.now() + expiresIn * 1000,
              connectedAt: new Date().toISOString(),
            };

            localStorage.setItem(STORAGE_KEY_GOOGLE, JSON.stringify(googleUser));
            resolve({ success: true, user: googleUser });
          } catch (fetchErr) {
            console.error('Erro ao obter perfil Google:', fetchErr);
            reject(fetchErr);
          }
        },
      });

      // Abre a janela oficial da Google (accounts.google.com)
      tokenClient.requestAccessToken();
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(safetyTimeout);
        console.error('Erro ao inicializar Google OAuth:', err);
        reject(err);
      }
    }
  });
};

const BACKUP_FILENAME = 'rise-dados-backup.json';

/**
 * Envia o ficheiro da cópia de segurança para o Google Drive do utilizador.
 * Mantém SEMPRE o mesmo ficheiro único ('rise-dados-backup.json'), substituindo o anterior
 * para não acumular ficheiros repetidos no Drive.
 */
export const uploadBackupToGoogleDrive = async (backupData, accessToken) => {
  if (!accessToken) {
    const err = new Error('Sessão Google expirada ou inexistente. Por favor inicia sessão novamente.');
    err.isAuthError = true;
    throw err;
  }

  const fileContent = JSON.stringify(backupData, null, 2);

  // 1. Pesquisa se já existe um ficheiro com este nome no Google Drive
  const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (searchRes.status === 401) {
    const err = new Error('Sessão Google expirada. Por favor reautentica.');
    err.isAuthError = true;
    throw err;
  }

  let existingFile = null;
  if (searchRes.ok) {
    const searchData = await searchRes.json().catch(() => ({}));
    if (searchData.files && searchData.files.length > 0) {
      existingFile = searchData.files[0];
    }
  }

  // 2. Se já existir, ATUALIZA (PATCH) o ficheiro existente para substituir o conteúdo
  if (existingFile) {
    const patchRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: fileContent,
      }
    );

    if (!patchRes.ok) {
      const errJson = await patchRes.json().catch(() => ({}));
      const err = new Error(errJson?.error?.message || 'Falha ao atualizar a cópia no Google Drive.');
      if (patchRes.status === 401 || errJson?.error?.status === 'UNAUTHENTICATED') {
        err.isAuthError = true;
      }
      throw err;
    }

    const patchResult = await patchRes.json();
    return {
      success: true,
      fileId: patchResult.id || existingFile.id,
      filename: BACKUP_FILENAME,
      updated: true,
      webViewLink: existingFile.webViewLink,
    };
  }

  // 3. Se ainda não existir, cria o ficheiro novo pela primeira vez (POST multipart)
  const metadata = {
    name: BACKUP_FILENAME,
    mimeType: 'application/json',
    description: 'Cópia de segurança oficial e sincronizada do Rise (Treinos, Pesos, Histórico e Perfil)',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    const err = new Error(errorJson?.error?.message || 'Falha ao guardar o ficheiro no Google Drive.');
    if (response.status === 401 || errorJson?.error?.status === 'UNAUTHENTICATED') {
      err.isAuthError = true;
    }
    throw err;
  }

  const result = await response.json();
  return {
    success: true,
    fileId: result.id,
    filename: BACKUP_FILENAME,
    updated: false,
    webViewLink: result.webViewLink,
  };
};

/**
 * Descarrega a cópia de segurança mais recente do Rise a partir do Google Drive do utilizador.
 * Procura primeiro pelo ficheiro único 'rise-dados-backup.json'.
 */
export const downloadLatestBackupFromGoogleDrive = async (accessToken) => {
  if (!accessToken) {
    const err = new Error('Sessão Google expirada ou inexistente.');
    err.isAuthError = true;
    throw err;
  }

  // 1. Pesquisa primeiro pelo ficheiro fixo 'rise-dados-backup.json' ou compatibilidade com anteriores
  const query = encodeURIComponent(`(name = '${BACKUP_FILENAME}' or name contains 'copia-seguranca-rise') and trashed = false`);
  const listRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&pageSize=1&fields=files(id,name,createdTime)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!listRes.ok) {
    const errJson = await listRes.json().catch(() => ({}));
    const err = new Error(errJson?.error?.message || 'Falha ao aceder aos ficheiros do Google Drive.');
    if (listRes.status === 401 || errJson?.error?.status === 'UNAUTHENTICATED') {
      err.isAuthError = true;
    }
    throw err;
  }

  const listData = await listRes.json();
  if (!listData.files || listData.files.length === 0) {
    return { found: false, message: 'Nenhuma cópia anterior do Rise encontrada no teu Google Drive.' };
  }

  const file = listData.files[0];

  // 2. Transfere os dados do ficheiro JSON
  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!downloadRes.ok) {
    const errJson = await downloadRes.json().catch(() => ({}));
    const err = new Error(errJson?.error?.message || 'Falha ao transferir o ficheiro de cópia do Google Drive.');
    if (downloadRes.status === 401 || errJson?.error?.status === 'UNAUTHENTICATED') {
      err.isAuthError = true;
    }
    throw err;
  }

  const backupData = await downloadRes.json();
  return {
    found: true,
    file,
    backupData,
  };
};

/**
 * Sincronização Inteligente Bidirecional com o Google Drive:
 * 1. Descarrega a cópia existente no Drive (se existir).
 * 2. Faz merge inteligente dos treinos, históricos e perfis locais com os da nuvem,
 *    garantindo que nenhum treino é apagado ou sobreposto por engano.
 * 3. Guarda a versão unificada localmente no telemóvel e envia-a de volta para o Drive.
 */
export const syncWithGoogleDrive = async (accessToken) => {
  if (!accessToken) {
    const err = new Error('Sessão Google expirada ou inexistente.');
    err.isAuthError = true;
    throw err;
  }

  const { exportBackupData, importBackupData } = await import('./storage');
  const localBackup = exportBackupData();

  // 1. Descarregar dados prévios do Drive
  let cloudBackup = null;
  try {
    const driveRes = await downloadLatestBackupFromGoogleDrive(accessToken);
    if (driveRes.found && driveRes.backupData) {
      cloudBackup = driveRes.backupData;
    }
  } catch (err) {
    if (err.isAuthError) throw err;
    console.warn('[Sync] Não foi possível ler cópia prévia do Drive:', err);
  }

  let mergedPayload = { ...(localBackup.data || {}) };
  let newItemsMerged = 0;

  if (cloudBackup) {
    const cloudPayload = cloudBackup.data && typeof cloudBackup.data === 'object' ? cloudBackup.data : cloudBackup;

    // A) Merge de Histórico (todas as chaves de histórico: fit_history_* e fit_rita_history)
    const allHistoryKeys = new Set([
      ...Object.keys(localBackup.data || {}).filter(k => k.startsWith('fit_history_') || k === 'fit_rita_history'),
      ...Object.keys(cloudPayload || {}).filter(k => k.startsWith('fit_history_') || k === 'fit_rita_history'),
    ]);

    allHistoryKeys.forEach((key) => {
      const localList = Array.isArray(localBackup.data?.[key]) ? localBackup.data[key] : [];
      const cloudList = Array.isArray(cloudPayload?.[key]) ? cloudPayload[key] : [];

      const seen = new Set();
      const combined = [];

      [...localList, ...cloudList].forEach((item) => {
        if (!item) return;
        const dedupeKey = item.id || `${item.data || ''}_${item.treinoTitulo || ''}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          combined.push(item);
        }
      });

      combined.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
      mergedPayload[key] = combined;
      if (combined.length > localList.length) {
        newItemsMerged += (combined.length - localList.length);
      }
    });

    // B) Merge de Treinos (fit_rita_workouts)
    const localWorkouts = Array.isArray(localBackup.data?.['fit_rita_workouts']) ? localBackup.data['fit_rita_workouts'] : [];
    const cloudWorkouts = Array.isArray(cloudPayload?.['fit_rita_workouts']) ? cloudPayload['fit_rita_workouts'] : [];
    const workoutMap = new Map();

    cloudWorkouts.forEach((w) => { if (w?.id) workoutMap.set(w.id, w); });
    localWorkouts.forEach((w) => {
      if (w?.id) {
        const existing = workoutMap.get(w.id);
        if (!existing || (w.exercicios?.length || 0) >= (existing.exercicios?.length || 0)) {
          workoutMap.set(w.id, w);
        }
      }
    });
    mergedPayload['fit_rita_workouts'] = Array.from(workoutMap.values());

    // C) Merge de Perfis (fit_rita_all_profiles)
    const localProfiles = Array.isArray(localBackup.data?.['fit_rita_all_profiles']) ? localBackup.data['fit_rita_all_profiles'] : [];
    const cloudProfiles = Array.isArray(cloudPayload?.['fit_rita_all_profiles']) ? cloudPayload['fit_rita_all_profiles'] : [];
    const profileMap = new Map();

    cloudProfiles.forEach((p) => { if (p?.id) profileMap.set(p.id, p); });
    localProfiles.forEach((p) => {
      if (p?.id) {
        profileMap.set(p.id, { ...(profileMap.get(p.id) || {}), ...p });
      }
    });
    mergedPayload['fit_rita_all_profiles'] = Array.from(profileMap.values());

    // D) Importar chaves adicionais da cloud que faltem localmente
    Object.keys(cloudPayload).forEach((k) => {
      if (mergedPayload[k] === undefined && (k.startsWith('fit_') || k === 'gemini_api_key')) {
        mergedPayload[k] = cloudPayload[k];
      }
    });

    // Guardar os dados unificados no localStorage
    importBackupData({ data: mergedPayload });
  }

  // 3. Fazer upload da versão completa unificada para o Google Drive
  const finalBackup = {
    ...localBackup,
    exportDate: new Date().toISOString(),
    deviceTime: new Date().toLocaleString('pt-PT'),
    data: mergedPayload,
  };

  const uploadResult = await uploadBackupToGoogleDrive(finalBackup, accessToken);

  const timeString = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  localStorage.setItem('fit_last_autosync_time', timeString);
  window.dispatchEvent(new CustomEvent('fit_autosync_updated', { detail: { time: timeString } }));
  window.dispatchEvent(new CustomEvent('fit_data_synchronized', { detail: { newItemsMerged } }));

  return {
    success: true,
    fileId: uploadResult.fileId,
    newItemsMerged,
    timeString,
    cloudHadData: !!cloudBackup,
  };
};

/**
 * Desconecta a conta Google
 */
export const disconnectGoogleAccount = () => {
  const saved = getSavedGoogleAccount();
  if (saved?.token && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(saved.token, () => {});
    } catch {}
  }
  localStorage.removeItem(STORAGE_KEY_GOOGLE);
  localStorage.removeItem('fit_last_autosync_time');
};

let syncDebounceTimer = null;

export const getLastAutoSyncTime = () => {
  try {
    return localStorage.getItem('fit_last_autosync_time') || null;
  } catch {
    return null;
  }
};

/**
 * Executa a sincronização automática em segundo plano para o Google Drive
 * Sempre que um treino é concluído, pesos editados ou perfil atualizado.
 */
export const triggerAutoSyncToGoogleDrive = async (delayMs = 2000) => {
  if (typeof window === 'undefined') return { skipped: true };

  const savedAccount = getSavedGoogleAccount();
  if (!savedAccount?.token) {
    return { skipped: true, reason: 'no_account' };
  }

  // Se o token estiver expirado, não tenta
  if (savedAccount.expiresAt && Date.now() > savedAccount.expiresAt) {
    return { skipped: true, reason: 'token_expired' };
  }

  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);

  return new Promise((resolve) => {
    syncDebounceTimer = setTimeout(async () => {
      try {
        const { exportBackupData } = await import('./storage');
        const backup = exportBackupData();
        const res = await uploadBackupToGoogleDrive(backup, savedAccount.token);

        const timeString = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem('fit_last_autosync_time', timeString);
        window.dispatchEvent(new CustomEvent('fit_autosync_updated', { detail: { time: timeString } }));
        console.log(`[Rise Auto-Sync] Cópia guardada automaticamente no Google Drive às ${timeString} (${res.filename})`);
        resolve({ success: true, res });
      } catch (err) {
        console.warn('[Rise Auto-Sync] Erro na sincronização silenciosa:', err);
        resolve({ success: false, error: err });
      }
    }, delayMs);
  });
};
