import { Navigate, useParams } from 'react-router';
import React, { useState, useEffect } from 'react';

import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

const VerifyConfirmation = () => {
  const { token } = useParams();
  const { verify } = useAuthContext();
  const [isVerify, setIsVerify] = useState(false);

  useEffect(() => {
    try {
      verify(token);
      setIsVerify(true);
    } catch (error) {
      setIsVerify(false);
    }
  }, [verify, token]);

  return <>{isVerify && <Navigate to={PATH_AFTER_LOGIN} />}</>;
};

export default VerifyConfirmation;
