import { useAuthContext } from 'src/auth/hooks';

const useCheckPermission = (permissions) => {
  const { permission, user } = useAuthContext();

  if (user && user.role === 'superadmin') {
    return true;
  }

  if (permission && permissions.every((item) => permission.map((val) => val.name).includes(item))) {
    return true;
  }

  return false;
};

export default useCheckPermission;
