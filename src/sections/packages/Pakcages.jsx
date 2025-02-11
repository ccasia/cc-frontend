import React, { useState } from 'react';

import { Button, Container } from '@mui/material';

import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import useGetPackages from 'src/hooks/use-get-packges';
import PackageLists from './packages-list';
import PackageCreate from './package-create';
import PackageEdit from './package-edit';

const pakcagesArray = [
  {
    type: 'Trail',
    valueMYR: 2800,
    valueSGD: 3100,
    totalCredits: 5,
    validityPeriod: 1,
  },
  {
    type: 'Basic',
    valueMYR: 8000,
    valueSGD: 8900,
    totalCredits: 15,
    validityPeriod: 2,
  },
  {
    type: 'Essential',
    valueMYR: 15000,
    valueSGD: 17500,
    totalCredits: 30,
    validityPeriod: 3,
  },
  {
    type: 'Pro',
    valueMYR: 23000,
    valueSGD: 29000,
    totalCredits: 50,
    validityPeriod: 5,
  },
  {
    type: 'Custom',
    valueMYR: 1,
    valueSGD: 1,
    totalCredits: 1,
    validityPeriod: 1,
  },
];

const Packages = () => {
  // const { data, isLoading } = useGetPackages();
  const { data, isLoading } = useGetPackages();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Packages"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Packages' },
          { name: 'Lists' },
        ]}
        action={
          <Button
            size="small"
            variant="contained"
            onClick={() => setOpen(true)}
            startIcon={<Iconify icon="mingcute:add-fill" />}
          >
            Create new Package
          </Button>
        }
      />
      <PackageLists packages={data} />
      <PackageCreate open={open} onClose={() => setOpen(false)} />
      <PackageEdit open={edit} onClose={() => setEdit(false)} />
    </Container>
  );
};

export default Packages;
