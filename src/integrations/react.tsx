// src/integrations/react.tsx
import React, { createContext, useContext } from 'react';
import { RequestClient } from '../core/requestClient';

// Create a context with a default RequestClient instance.
const RequestClientContext = createContext<RequestClient>(new RequestClient());

// Provider component for the RequestClient context.
export const RequestClientProvider: React.FC<{ client: RequestClient; children: React.ReactNode }> = ({ client, children }) => {
  return (
    <RequestClientContext.Provider value={client}>
      {children}
    </RequestClientContext.Provider>
  );
};

// Custom hook to access the RequestClient context.
export function useRequestClient(): RequestClient {
  return useContext(RequestClientContext);
}
