import { Helmet } from 'react-helmet-async';

// import Packages from 'src/sections/packages/packages/view';
import Packages from 'src/sections/packages/Pakcages';

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Packages</title>
      </Helmet>
     
       <Packages /> 
    </>
  );
}
