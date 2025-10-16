// src/components/providers/app-provider.tsx

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { OracleContractApi } from '@/lib/contracts/oracle';
import { Contract } from 'dedot/contracts';
import { useContract } from 'typink';

interface AppContextProps {
  oracleContract?: Contract<OracleContractApi>;
}

const AppContext = createContext<AppContextProps>({} as AppContextProps);

export const useApp = () => {
  return useContext(AppContext);
};

interface Props {
  children: ReactNode;
}

export function AppProvider({ children }: Props) {
  const { contract: oracleContract } = useContract<OracleContractApi>('oracle');

  return (
    <AppContext.Provider
      value={{
        oracleContract,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}