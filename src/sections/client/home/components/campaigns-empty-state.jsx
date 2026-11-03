import PropTypes from 'prop-types';

import { Button } from '@mui/material';

import { CAMPAIGN_TABS } from '../utils';
import EmptyState, { primarySx, secondarySx } from './empty-state';

export default function CampaignsEmptyState({ tab, query, hasCampaigns, onTabChange, onClear }) {
  const current = CAMPAIGN_TABS.find((t) => t.value === tab);
  const search = query.trim();

  if (search && hasCampaigns) {
    const inTab = tab !== 'all';
    return (
      <EmptyState
        icon="solar:magnifer-linear"
        title={`No campaigns match “${search}”`}
        actions={
          <>
            <Button disableElevation variant="contained" onClick={onClear} sx={primarySx}>
              Clear search
            </Button>
            {inTab && (
              <Button variant="outlined" onClick={() => onTabChange('all')} sx={secondarySx}>
                Search all campaigns
              </Button>
            )}
          </>
        }
      >
        {inTab
          ? `You searched in ${current.label}. Try another name, or search all campaigns.`
          : 'Check the spelling, or try another name.'}
      </EmptyState>
    );
  }

  const { icon, tone, title, body } = (hasCampaigns ? current : CAMPAIGN_TABS[0]).empty;
  return (
    <EmptyState
      icon={icon}
      tone={tone}
      title={title}
      actions={
        hasCampaigns &&
        tab !== 'all' && (
          <Button variant="outlined" onClick={() => onTabChange('all')} sx={secondarySx}>
            Show all campaigns
          </Button>
        )
      }
    >
      {body}
    </EmptyState>
  );
}

CampaignsEmptyState.propTypes = {
  tab: PropTypes.string.isRequired,
  query: PropTypes.string.isRequired,
  hasCampaigns: PropTypes.bool,
  onTabChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};
