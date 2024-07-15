import { useState, useEffect } from 'react';

// import { Box } from '@mui/system';
import { Box } from '@mui/material';

import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function ModernRegisterView() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const [status, setStatus] = useState(false);

  // const verify = async () => {
  //   try {
  //     const respone = await axios.put(endpoints.auth.verfiyAdmin, { token });
  //     console.log(respone);
  //     setStatus(true);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.put(endpoints.auth.verfiyAdmin, { token });
        setStatus(true);
      } catch (error) {
        console.log(error);
      }
    };

    verify();
  }, [token]);

  return <Box>{status ? <h1>email verfied</h1> : <h1> fail to verify</h1>}</Box>;
}
