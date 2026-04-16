import { Helmet } from 'react-helmet-async';
import MyInviteLinkView from 'src/sections/admin/bd/my-invite-link/view';

export default function BDInviteLinkPage() {
  return (
    <>
      <Helmet>
        <title>My invite link | Cult Creative</title>
      </Helmet>
      <MyInviteLinkView />
    </>
  );
}
