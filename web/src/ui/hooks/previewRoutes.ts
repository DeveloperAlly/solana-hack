import { createContext, useContext } from 'react';

/** Product previews retain product navigation while all fixture actions remain isolated (issue 114). */
export const PreviewRoutesContext = createContext(false);
export const usePreviewRoutes = () => useContext(PreviewRoutesContext);
