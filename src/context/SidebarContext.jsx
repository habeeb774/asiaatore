import React, { createContext, useContext, useState, useCallback } from 'react';

const SidebarContext = createContext({
  open: false,
  setOpen: () => {},
  toggle: () => {}
});

export const SidebarProvider = ({ children, defaultOpen = false }) => {
  const [open, setOpenState] = useState(!!defaultOpen);
  const setOpen = useCallback((v) => setOpenState(Boolean(v)), []);
  const toggle = useCallback(() => setOpenState((s) => !s), []);
  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);

export default SidebarContext;
