import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

//  import TagManager from 'react-gtm-module';
import App from './app';
import { SplashScreen } from './components/loading-screen';

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <HelmetProvider>
    <BrowserRouter>
      <Suspense fallback={<SplashScreen />}>
        <App />
        <Toaster />
      </Suspense>
    </BrowserRouter>
  </HelmetProvider>
);
