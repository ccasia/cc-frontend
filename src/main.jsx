import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

//  import TagManager from 'react-gtm-module';
import App from './app';

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));
// const tagManagerArgs = {
//   gtmId: "GTM-WQB496XK", 
// };

// TagManager.initialize(tagManagerArgs);

root.render(
  <HelmetProvider>
    <BrowserRouter>
      <Suspense>
        <App />
        <Toaster />
      </Suspense>
    </BrowserRouter>
  </HelmetProvider>
);
