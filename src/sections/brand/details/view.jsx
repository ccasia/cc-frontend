/* eslint-disable no-unused-vars */
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Container from '@mui/material/Container';
import { Tab, Tabs, Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import useGetCompany from 'src/hooks/use-get-company';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import BrandsList from './brand/brand-general';
import JobDetailsContent from './client/client-details-content';

// ----------------------------------------------------------------------

export default function CompanyDetails({ id }) {
  const settings = useSettingsContext();
  const { data: companies, isLoading } = useGetCompany();
  const router = useRouter();

  const currentCompany = !isLoading && companies.filter((elem) => elem.id === id)[0];

  const [currentTab, setCurrentTab] = useState('details');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const renderTabs = (
    <Tabs
      value={currentTab}
      onChange={handleChangeTab}
      sx={{
        mb: { xs: 3, md: 5 },
      }}
    >
      {[
        { label: 'Details', value: 'details' },
        { label: 'Brands', value: 'brand' },
        { label: 'Campaigns', value: 'campaign' },
      ].map((elem, index) => (
        <Tab
          key={index}
          value={elem.value}
          label={elem.label}
          iconPosition="end"
          icon={
            elem.value === 'brand'
              ? currentCompany?.brand?.length > 0 && (
                  <Label variant="filled">{currentCompany?.brand?.length}</Label>
                )
              : ''
          }
        />
      ))}
    </Tabs>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <Button
        startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} sx={{ ml: 1 }} />}
        onClick={() => router.push(paths.dashboard.company.discover)}
      >
        Back
      </Button>
      {renderTabs}
      {currentTab === 'details' && currentCompany && <JobDetailsContent company={currentCompany} />}
      {currentTab === 'brand' && currentCompany && <BrandsList brands={currentCompany?.brand} />}
    </Container>
  );
}

CompanyDetails.propTypes = {
  id: PropTypes.string,
};
