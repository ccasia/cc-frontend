/* eslint-disable perfectionist/sort-imports */
import 'src/global.css';

// ----------------------------------------------------------------------

import Router from 'src/routes/sections';

import ThemeProvider from 'src/theme';

import { useScrollToTop } from 'src/hooks/use-scroll-to-top';

import ProgressBar from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';
import { LocalizationProvider } from './locales';
import { SnackbarProvider } from './components/snackbar';
import { UnreadMessageCountProvider } from './context/UnreadMessageCountContext';
import SocketProvider from './socket/context/socket';
import PoppupProvider from './components/popup/popup-provider';
import 'core-js/stable';
// import CreatorOnBoardingForm from './components/CreatorOnBoardingForm';
import ShortlistedCreatorPopUp from 'src/sections/campaign/discover/admin/campaign-detail-creator/hooks/shortlisted-creator-popup'

// ----------------------------------------------------------------------
// Test
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

  return (
    <AuthProvider>
      <LocalizationProvider>
        <SettingsProvider
          defaultSettings={{
            themeMode: 'light', // 'light' | 'dark'
            themeDirection: 'ltr', //  'rtl' | 'ltr'
            themeContrast: 'default', // 'default' | 'bold'
            themeLayout: 'vertical', // 'vertical' | 'horizontal' | 'mini'
            themeColorPresets: 'default', // 'default' | 'cyan' | 'purple' | 'blue' | 'orange' | 'red'
            themeStretch: false,
          }}
        >
       
          <ThemeProvider>
            <PoppupProvider>
              <SnackbarProvider>
                <MotionLazy>
                  <SocketProvider>
                    <UnreadMessageCountProvider>
                      {/* <CreatorOnBoardingForm /> */}
                      <SettingsDrawer />
                      <ProgressBar />
                      <ShortlistedCreatorPopUp/>
                     
                      <Router />
                    </UnreadMessageCountProvider>
                  </SocketProvider>
                </MotionLazy>
              </SnackbarProvider>
            </PoppupProvider>
          </ThemeProvider>
        </SettingsProvider>
      </LocalizationProvider>
    </AuthProvider>
  );
}
