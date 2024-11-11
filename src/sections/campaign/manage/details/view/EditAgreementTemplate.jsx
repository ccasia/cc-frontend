import React from 'react';
import PropTypes from 'prop-types';

import { useAuthContext } from 'src/auth/hooks';

import PDFEditorModal from 'src/sections/campaign/create/pdf-editor';

// import { PDFEditorModal } from 'src/sections/campaign/create/form';

const EditAgreementTemplate = ({ open, campaign, onClose }) => {
  const { user } = useAuthContext();

  return (
    <PDFEditorModal
      open={open.campaignAgreement}
      onClose={() => onClose('campaignAgreement')}
      user={user}
      campaignId={campaign?.id}
    />
  );
};
export default EditAgreementTemplate;

EditAgreementTemplate.propTypes = {
  open: PropTypes.object,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
