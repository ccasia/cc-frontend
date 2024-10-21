import React from 'react';
import { Helmet } from 'react-helmet-async';

import { CreatorTableView } from './creator-list-table/view';

export default function CreatorList() {
  return (
    <>
      <Helmet>
        <title>Creator</title>
      </Helmet>

      <CreatorTableView />
    </>
  );
}
