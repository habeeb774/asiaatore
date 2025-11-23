import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const SidebarContext = createContext({
  open: false,
  setOpen: () => {},
  toggle: () => {}
});

export const SidebarProvider = ({ children, defaultOpen = false }) => {
  const [open, setOpenState] = useState(!!defaultOpen);
  const setOpen = useCallback((v) => setOpenState(Boolean(v)), []);
  const toggle = useCallback(() => setOpenState((s) => !s), []);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ open, setOpen, toggle }), [open, setOpen, toggle]);
  
  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);

export default SidebarContext;
