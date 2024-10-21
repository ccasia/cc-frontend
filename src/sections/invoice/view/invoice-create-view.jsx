import { useSettingsContext } from 'src/components/settings';

import InvoiceNewEditForm from '../invoice-new-edit-form';

// ----------------------------------------------------------------------

export default function InvoiceCreateView() {
  const settings = useSettingsContext();

  return <InvoiceNewEditForm />;
}
