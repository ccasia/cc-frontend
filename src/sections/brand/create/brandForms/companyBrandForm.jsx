// Desc: Company Brand Form
import { useState } from 'react';

import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import BrandWithCompany from './FirstForms/brandWithCompany';
import CompanyBrandBasic from './FirstForms/companyBrandBasic';

function CompanyBrandForm() {
  const [role, setRole] = useState('admin');

  return (
    <Box
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
      }}
    >
      <Box
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
            { label: ' New Brand ', value: 'basic' },
            { label: 'New Brand With Exicting company', value: 'second' },
          ].map((i) => (
            <ToggleButton key={i.value} value={i.value} sx={{ width: 1 }}>
              {i.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      {/* <CompanyBrandBasic /> */}
      {role === 'basic' && <CompanyBrandBasic />}
      {role === 'second' && <BrandWithCompany />}
    </Box>
  );
}

export default CompanyBrandForm;
