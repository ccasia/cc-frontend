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
      {/* <Box
        sx={{ display: 'flex', flexDirection: 'row', justifySelf: 'center', alignSelf: 'center' }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={role}
          onChange={(event, newValue) => {
            if (newValue !== null) {
              setRole(newValue);
            }
          }}
        >
          {[
            { label: 'Create a new brand', value: 'basic' },
            { label: 'Create a new brand with existing company', value: 'second' },
          ].map((i) => (
            <ToggleButton key={i.value} value={i.value} sx={{ width: 1 }}>
              {i.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box> */}
      <CompanyBrandBasic />

      {/* {role === 'basic' && <CompanyBrandBasic />} */}
      {/* {role === 'second' && <BrandWithCompany />} */}
    </Box>
  );
}

export default CompanyBrandForm;
