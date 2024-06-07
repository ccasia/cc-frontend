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

import JobDetailsContent from './job-details-content';
import JobDetailsCandidates from './job-details-candidates';

// ----------------------------------------------------------------------

export default function JobDetailsView({ id }) {
  const settings = useSettingsContext();
  const { companies } = useGetCompany();
  const router = useRouter();

  const currentCompany = companies && companies.filter((elem) => elem.id === id)[0];

  const [currentTab, setCurrentTab] = useState('details');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  // const renderTabs = (
  //   <Tabs
  //     value={currentTab}
  //     onChange={handleChangeTab}
  //     sx={{
  //       mb: { xs: 3, md: 5 },
  //     }}
  //   >
  //     {JOB_DETAILS_TABS.map((tab) => (
  //       <Tab
  //         key={tab.value}
  //         iconPosition="end"
  //         value={tab.value}
  //         label={tab.label}
  //         icon={
  //           tab.value === 'candidates' ? (
  //             <Label variant="filled">{currentJob?.candidates.length}</Label>
  //           ) : (
  //             ''
  //           )
  //         }
  //       />
  //     ))}
  //   </Tabs>
  // );

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
        { label: 'Brands', value: 'brands' },
      ].map((elem, index) => (
        <Tab
          key={index}
          value={elem.value}
          label={elem.label}
          iconPosition="end"
          icon={
            elem.value === 'brands'
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
      {/* {JSON.stringify(currentCompany)} */}
      {/* <JobDetailsToolbar
        backLink={paths.dashboard.job.root}
        editLink={paths.dashboard.job.edit(`${currentJob?.id}`)}
        liveLink="#"
        publish={publish || ''}
        onChangePublish={handleChangePublish}
        publishOptions={JOB_PUBLISH_OPTIONS}
      /> */}
      <Button
        startIcon={<Iconify icon="material-symbols:arrow-back-ios" width={12} />}
        onClick={() => router.push(paths.dashboard.brand.discover)}
      >
        Back
      </Button>
      {renderTabs}
      {currentTab === 'details' && currentCompany && <JobDetailsContent company={currentCompany} />}
      {currentTab === 'brands' && currentCompany && (
        <JobDetailsCandidates brands={currentCompany?.brand} />
      )}

      {/* {currentTab === 'candidates' && <JobDetailsCandidates candidates={currentJob?.candidates} />} */}
    </Container>
  );
}

JobDetailsView.propTypes = {
  id: PropTypes.string,
};
