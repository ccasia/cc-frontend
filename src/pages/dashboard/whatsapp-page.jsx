import { Helmet } from 'react-helmet-async';

import WhatsappDashboard from 'src/sections/whatsapp/view/view';

// ----------------------------------------------------------------------

export default function WhatsappDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Whatsapp Dashboard</title>
      </Helmet>

      <WhatsappDashboard />
    </>
  );
}
