import { Helmet } from 'react-helmet-async';

import ApprovalPageView from 'src/sections/approval/approval-page-view';

export default function ApprovalPage() {
  return (
    <>
      <Helmet>
        <title>Creator Approval</title>
      </Helmet>
      <ApprovalPageView />
    </>
  );
}
