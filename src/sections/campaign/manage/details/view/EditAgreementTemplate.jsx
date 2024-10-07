import React from 'react';
import PropTypes from 'prop-types';

import { useAuthContext } from 'src/auth/hooks';

import { PDFEditorModal } from 'src/sections/campaign/create/form';

const EditAgreementTemplate = ({ open, campaign, onClose }) => {
  const { user } = useAuthContext();

  //   const processPdf = async () => {
  //     const blob = await pdf(
  //       <AgreementTemplate ADMIN_IC_NUMBER={icNumber} ADMIN_NAME={name} />
  //     ).toBlob();

  //     const pdfUrl = URL.createObjectURL(blob);

  //     return pdfUrl;
  //   };

  return (
    // <Dialog open={open.campaignAgreement} onClose={() => onClose('campaignAgreement')}>
    //   <DialogTitle>Edit Agreement Template</DialogTitle>
    //   <DialogContent />
    //   <DialogActions />
    // </Dialog>
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
