import { Helmet } from 'react-helmet-async';

import ReportingList from 'src/sections/report/view/reporting-list';

export default function ReportPage() {
  return (
    <>
      <Helmet>
        <title>Performance Report</title>
      </Helmet>

      <ReportingList />
    </>
  );
}
