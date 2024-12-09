import { useContext } from 'react';

import { mainContext } from '../main';

export const useMainContext = () => useContext(mainContext);
