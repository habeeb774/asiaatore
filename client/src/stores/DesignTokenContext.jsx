import React, { createContext, useCallback, useMemo, useState } from 'react';
import { applyDesignTokens, mergeTokenMaps, readDesignTokens } from '../theme/designTokens';

const noop = () => {};

const DesignTokenContext = createContext({
  tokens: {},
  setTokens: noop,
  applyTokens: noop
});

export const DesignTokenProvider = ({ initialTokens, children }) => {
  const [tokens, setTokensState] = useState(() => mergeTokenMaps(readDesignTokens(), initialTokens));

  const applyTokens = useCallback((patch) => {
    if (!patch || typeof patch !== 'object') return;
    applyDesignTokens(patch);
    setTokensState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(() => ({
    tokens,
    setTokens: applyTokens,
    applyTokens
  }), [tokens, applyTokens]);

  return (
    <DesignTokenContext.Provider value={value}>
      {children}
    </DesignTokenContext.Provider>
  );
};

export const useDesignTokens = () => React.useContext(DesignTokenContext);

export default DesignTokenContext;
