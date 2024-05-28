import { Helmet } from 'react-helmet-async';

import CreateBrand from 'src/sections/brand/create/view';

export default function Page() {
    return (
      <>
        <Helmet>
          <title>Create Brand</title>
        </Helmet>
  
        <CreateBrand />
      </>
    );
  }
  