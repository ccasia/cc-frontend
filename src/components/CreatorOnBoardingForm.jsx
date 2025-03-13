import React, { useMemo } from 'react';

import { useAuthContext } from 'src/auth/hooks';

import CreatorForm from 'src/sections/creator/form/creatorForm';

const CreatorOnBoardingForm = () => {
  const { user } = useAuthContext();

  const isFormCompleted = useMemo(() => !user?.creator?.isOnBoardingFormCompleted, [user]);

  return <CreatorForm open={isFormCompleted} />;
};

export default CreatorOnBoardingForm;
