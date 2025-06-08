import { useParams } from 'react-router-dom';

import CreatorProfileView from 'src/sections/creator/creator-profile-view';

export default function CreatorProfile() {
  const { id } = useParams();
  
  return <CreatorProfileView id={id} />;
} 