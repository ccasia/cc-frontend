import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Stack } from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import CtaButton from 'src/components/cta-button';

import SwapIn from './swap-in';
import PolicyBody from './policy-body';
import PolicySettings from './policy-settings';
import { PolicyStatus, PolicyStatusFix, PolicyStatusBadge } from './policy-status';
import PlatformPolicyForm from './platform-policy-form';
import { ICONS, PLATFORM_META, getPolicyStatus, normalizeVersion } from '../utils';

export default function PlatformPanel({ policy, tabs }) {
  const editing = useBoolean();
  const [savedKeys, setSavedKeys] = useState([]);
  const { store } = PLATFORM_META[policy.platform];

  // The ruler plays its intro once per platform, not again on every Edit or Cancel
  const introPlayed = useRef(false);
  useEffect(() => {
    introPlayed.current = true;
  }, []);

  const layout = {
    top: tabs,
    statusBadge: <PolicyStatusBadge policy={policy} />,
    status: getPolicyStatus(policy).tone !== 'success' && (
      <PolicyStatus
        policy={policy}
        action={<PolicyStatusFix policy={policy} disabled={editing.value} />}
      />
    ),
    animateRuler: !introPlayed.current,
  };

  if (editing.value) {
    return (
      <PlatformPolicyForm
        policy={policy}
        layout={layout}
        onDone={(changed = []) => {
          setSavedKeys(changed);
          editing.onFalse();
        }}
      />
    );
  }

  return (
    <PolicyBody
      {...layout}
      title="Versions"
      description="Saved changes reach users the next time they open the app."
      action={
        <CtaButton
          variant="white"
          size="small"
          onClick={() => {
            setSavedKeys([]);
            editing.onTrue();
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Iconify icon={ICONS.edit} width={14} />
            <span>Edit</span>
          </Stack>
        </CtaButton>
      }
      minimumVersion={normalizeVersion(policy.minimumVersion)}
      latestVersion={normalizeVersion(policy.latestVersion)}
      storeVersion={policy.storeVersion}
      storeName={store}
      message={policy.message}
    >
      <SwapIn>
        <PolicySettings policy={policy} highlight={savedKeys} />
      </SwapIn>
    </PolicyBody>
  );
}

PlatformPanel.propTypes = {
  policy: PropTypes.object.isRequired,
  tabs: PropTypes.node,
};
