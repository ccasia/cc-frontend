/* eslint-disable perfectionist/sort-imports */
import 'src/global.css';

import { useEffect } from 'react';

// ----------------------------------------------------------------------

import Router from 'src/routes/sections';

import ThemeProvider from 'src/theme';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import ProgressBar from 'src/components/progress-bar';
import { hideBootScreen } from 'src/components/loading-screen';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from './locales';
import { SnackbarProvider } from './components/snackbar';
import { UnreadMessageCountProvider } from './context/UnreadMessageCountContext';
import SocketProvider from './socket/context/socket';
import PopupProvider from './components/popup/popup-provider';
import NpsProvider from './components/nps-feedback/nps-provider';
import 'core-js/stable';

// ----------------------------------------------------------------------

const queryClient = new QueryClient();

// Kept outside the component: a new object on each render made the settings reset on every page change.
const DEFAULT_SETTINGS = {
  themeMode: 'light', // 'light' | 'dark'
  themeDirection: 'ltr', //  'rtl' | 'ltr'
  themeContrast: 'default', // 'default' | 'bold'
  themeLayout: 'vertical', // 'vertical' | 'horizontal' | 'mini'
  themeColorPresets: 'default', // 'default' | 'cyan' | 'purple' | 'blue' | 'orange' | 'red'
  themeStretch: false,
};

export default function App() {
  const charAt = `

  ██████████     ██████████
  ██             ██
  ██             ██ 
  ██             ██
  ██████████     ██████████

  `;

  console.info(`%c${charAt}`, 'color: #5BE49B');

  useScrollToTop();

  useEffect(() => {
    hideBootScreen('ring');
    const fallback = setTimeout(hideBootScreen, 10000);
    return () => clearTimeout(fallback);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocalizationProvider>
          <SettingsProvider defaultSettings={DEFAULT_SETTINGS}>
            <ThemeProvider>
              <SnackbarProvider>
                <MotionLazy>
                  <SocketProvider>
                    <PopupProvider>
                      <NpsProvider>
                        <UnreadMessageCountProvider>
                          {/* <CreatorOnBoardingForm /> */}
                          <SettingsDrawer />
                          <ProgressBar />
                          <Router />
                        </UnreadMessageCountProvider>
                      </NpsProvider>
                    </PopupProvider>
                  </SocketProvider>
                </MotionLazy>
              </SnackbarProvider>
            </ThemeProvider>
          </SettingsProvider>
        </LocalizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
