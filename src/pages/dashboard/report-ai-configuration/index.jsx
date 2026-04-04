import { Helmet } from 'react-helmet-async';

import ReportAiConfigurations from 'src/sections/report-ai-configurations/view/view';

export default function ReportAiConfigurationPage() {
  return (
    <>
      <Helmet>
        <title>Performance Report</title>
      </Helmet>

      <ReportAiConfigurations />
    </>
  );
}
