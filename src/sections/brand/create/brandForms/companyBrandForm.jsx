// Desc: Company Brand Form
import { useState } from 'react';

import Box from '@mui/material/Box';

import CompanyBrandBasic from './FirstForms/companyBrandBasic';

function CompanyBrandForm() {
  // eslint-disable-next-line no-unused-vars
  const [role, setRole] = useState('admin');

  return (
    <Box
      sx={{
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
      }}
    >
      <CompanyBrandBasic />
    </Box>
  );
}

export default CompanyBrandForm;
