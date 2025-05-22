import { Helmet } from 'react-helmet-async';

import ReportingView from 'src/sections/reporting/view/reporting-view';

export default function ReportPage() {
  return (
    <>
      <Helmet>
        <title>Performance Report</title>
      </Helmet>

      <ReportingView />
    </>
  );
}
