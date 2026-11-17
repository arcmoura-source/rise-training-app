import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import WorkoutsListView from './components/WorkoutsListView';
import WorkoutDetailView from './components/WorkoutDetailView';
import VideosView from './components/VideosView';
import AiCoachView from './components/AiCoachView';
import ProfileView from './components/ProfileView';
import RestTimerModal from './components/RestTimerModal';
import SplashScreen from './components/SplashScreen';
import OnboardingQuiz from './components/OnboardingQuiz';

import {
  getProfile,
  getProfilesList,
  saveProfile,
  createNewProfile,
  switchActiveProfile,
  deleteProfile,
  getWorkouts,
  saveWorkouts,
  getHistory,
  addWorkoutHistory,
} from './services/storage';
import { triggerAutoSyncToGoogleDrive } from './services/googleAuth';

export default function App() {
  const isRitaBuild = import.meta.env.VITE_APP_TARGET === 'rita' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('rita'));

  const [profiles, setProfiles] = useState(() => getProfilesList());
  const [profile, setProfileState] = useState(() => {
    if (isRitaBuild) {
      return getProfile();
    }
    const saved = getProfile();
    // In users build, if already has a saved profile with a name, keep it safe and mark onboarding as complete
    if (saved && saved.nome && saved.nome.trim() !== '' && saved.id !== 'perfil-temp') {
      localStorage.setItem('fit_app_onboarding_completed', 'true');
      return saved;
    }
    if (!localStorage.getItem('fit_app_onboarding_completed')) {
      return {
        id: 'perfil-temp',
        nome: '',
        peso: 60,
        massaMuscular: 38,
        altura: 1.65,
        objetivo: 'Hipertrofia & Força',
        ondeTreina: 'both',
        diasSemanaAlvo: 4,
        nivel: 'Iniciante',
      };
    }
    return saved;
  });
  const [workouts, setWorkoutsState] = useState(() => getWorkouts());
  const [history, setHistoryState] = useState(() => {
    if (isRitaBuild) {
      return getHistory('perfil-rita');
    }
    const currentId = getProfile()?.id;
    if (currentId && currentId !== 'perfil-temp') {
      localStorage.setItem('fit_app_onboarding_completed', 'true');
      return getHistory(currentId);
    }
    if (!localStorage.getItem('fit_app_onboarding_completed')) {
      return [];
    }
    if (!currentId || currentId === 'perfil-rita') return [];
    return getHistory(currentId);
  });

  // Ensure persistent storage so mobile OSes never purge local data
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        if (persistent) console.log('Rise: Armazenamento persistente ativo.');
      }).catch(() => {});
    }
  }, []);

  // Automatically synchronize history when active profile changes
  useEffect(() => {
    if (profile?.id) {
      if (!isRitaBuild && profile.id === 'perfil-temp') {
        setHistoryState([]);
      } else {
        setHistoryState(getHistory(profile.id));
      }
    }
  }, [profile?.id]);

  const [currentTab, setCurrentTab] = useState('home');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    if (isRitaBuild) return true;
    return localStorage.getItem('fit_app_onboarding_completed') === 'true';
  });

  useEffect(() => {
    // Sincronização automática em segundo plano pouco depois de iniciar a app
    const timer = setTimeout(() => {
      triggerAutoSyncToGoogleDrive(0);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  const handleStartWorkout = (workout) => {
    setActiveWorkout(workout);
  };

  const handleFinishWorkout = (summary, finalWorkoutData) => {
    const updatedHistory = addWorkoutHistory(summary, profile?.id);
    setHistoryState(updatedHistory);

    // Update base workouts if weights changed during workout
    const updatedWorkouts = workouts.map((w) =>
      w.id === finalWorkoutData.id ? finalWorkoutData : w
    );
    setWorkoutsState(updatedWorkouts);
    saveWorkouts(updatedWorkouts);

    setActiveWorkout(null);
    setCurrentTab('profile');

    // Auto-Sync em segundo plano para o Google Drive
    triggerAutoSyncToGoogleDrive(1200);
  };

  const handleLogVideoWorkout = (videoLogEntry) => {
    const updatedHistory = addWorkoutHistory(videoLogEntry, profile?.id);
    setHistoryState(updatedHistory);
    setCurrentTab('home');

    // Auto-Sync em segundo plano para o Google Drive
    triggerAutoSyncToGoogleDrive(1200);
  };

  const handleAddWorkout = (newWorkout) => {
    const updated = [...workouts, newWorkout];
    setWorkoutsState(updated);
    saveWorkouts(updated);
    triggerAutoSyncToGoogleDrive(2500);
  };

  const handleUpdateWorkout = (updatedWorkout) => {
    const updated = workouts.map((w) =>
      w.id === updatedWorkout.id ? updatedWorkout : w
    );
    setWorkoutsState(updated);
    saveWorkouts(updated);
    triggerAutoSyncToGoogleDrive(2500);
  };

  const handleDeleteWorkout = (workoutId) => {
    const updated = workouts.filter((w) => w.id !== workoutId);
    setWorkoutsState(updated);
    saveWorkouts(updated);
    triggerAutoSyncToGoogleDrive(2500);
  };

  const handleUpdateProfile = (newProfile) => {
    setProfileState(newProfile);
    saveProfile(newProfile);
    setProfiles(getProfilesList());

    // Auto-Sync em segundo plano para o Google Drive
    triggerAutoSyncToGoogleDrive(2000);

    // Adapt active tab if restricted
    if (newProfile.ondeTreina === 'gym' && currentTab === 'videos') {
      setCurrentTab('home');
    } else if (newProfile.ondeTreina === 'home' && currentTab === 'workouts') {
      setCurrentTab('home');
    }
  };

  const handleCreateProfile = (profileData) => {
    const created = createNewProfile(profileData);
    setProfileState(created);
    setProfiles(getProfilesList());
    setHistoryState(getHistory(created.id)); // O novo perfil começa com 0 treinos
    if (created.ondeTreina === 'gym' && currentTab === 'videos') {
      setCurrentTab('home');
    } else if (created.ondeTreina === 'home' && currentTab === 'workouts') {
      setCurrentTab('home');
    }
  };

  const handleDeleteProfile = (profileId) => {
    const updated = deleteProfile(profileId);
    setProfiles(updated);
    const newActive = getProfile();
    setProfileState(newActive);
    setHistoryState(getHistory(newActive.id));
  };

  const handleSwitchProfile = (profileId) => {
    const switched = switchActiveProfile(profileId);
    setProfileState(switched);
    setProfiles(getProfilesList());
    setHistoryState(getHistory(switched.id)); // Alterna para o histórico próprio do utilizador
    if (switched.ondeTreina === 'gym' && currentTab === 'videos') {
      setCurrentTab('home');
    } else if (switched.ondeTreina === 'home' && currentTab === 'workouts') {
      setCurrentTab('home');
    }
  };

  const handleCompleteOnboarding = (newProfile) => {
    localStorage.setItem('fit_app_onboarding_completed', 'true');
    setHasCompletedOnboarding(true);
    handleUpdateProfile(newProfile);
    setHistoryState(getHistory(newProfile.id));
    setCurrentTab('home');
  };

  const onTabChange = (tabId) => {
    setCurrentTab(tabId);
  };

    return (
    <div className="h-[100dvh] w-full bg-sand-200/40 flex justify-center text-sand-500 font-sans overflow-hidden">
      <div className="w-full max-w-md h-full bg-cream-100 relative flex flex-col justify-between shadow-none sm:shadow-2xl overflow-hidden pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Splash Screen on app launch */}
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        {/* First-time Onboarding Quiz (for new users / clients) */}
        {!showSplash && !hasCompletedOnboarding && (
          <OnboardingQuiz onComplete={handleCompleteOnboarding} />
        )}

        {/* Dynamic Content Area */}
        <div className="flex-1 px-4 sm:px-5 pt-1 pb-3 overflow-y-auto min-h-0">
          {activeWorkout ? (
            <WorkoutDetailView
              workout={activeWorkout}
              onBack={() => setActiveWorkout(null)}
              onFinishWorkout={handleFinishWorkout}
              onOpenTimer={() => setIsTimerOpen(true)}
            />
          ) : (
            <>
              {currentTab === 'home' && (
                <HomeView
                  profile={profile}
                  workouts={workouts}
                  onStartWorkout={handleStartWorkout}
                  setTab={setCurrentTab}
                  history={history}
                />
              )}

              {currentTab === 'workouts' && (
                <WorkoutsListView
                  workouts={workouts}
                  onStartWorkout={handleStartWorkout}
                  onAddWorkout={handleAddWorkout}
                  onUpdateWorkout={handleUpdateWorkout}
                  onDeleteWorkout={handleDeleteWorkout}
                />
              )}

              {currentTab === 'videos' && (
                <VideosView
                  profile={profile}
                  onLogVideoWorkout={handleLogVideoWorkout}
                  history={history}
                />
              )}

              {currentTab === 'coach' && (
                <AiCoachView profile={profile} workouts={workouts} />
              )}

              {currentTab === 'profile' && (
                <ProfileView
                  profile={profile}
                  profiles={profiles}
                  onUpdateProfile={handleUpdateProfile}
                  onCreateProfile={handleCreateProfile}
                  onSwitchProfile={handleSwitchProfile}
                  onDeleteProfile={handleDeleteProfile}
                  history={history}
                />
              )}
            </>
          )}
        </div>

        {/* Bottom Navigation (dynamically adapts based on user's ondeTreina) */}
        <Navbar
          currentTab={currentTab}
          setTab={onTabChange}
          isWorkoutActive={!!activeWorkout}
          ondeTreina={profile.ondeTreina || 'both'}
        />

        {/* Rest Timer Modal */}
        <RestTimerModal
          isOpen={isTimerOpen}
          onClose={() => setIsTimerOpen(false)}
          initialSeconds={90}
        />
      </div>
    </div>
  );
}
