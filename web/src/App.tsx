import { Route, Routes } from 'react-router';
import { routes } from './config/routes';
import { Landing } from './screens/landing/Landing';
import { Placeholder } from './screens/placeholder/Placeholder';
import { Workbench } from './system/Workbench';

export function App() {
  return (
    <Routes>
      {routes.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={r.screen === 'landing' ? <Landing /> : r.screen === 'workbench' ? <Workbench /> : <Placeholder route={r} />}
        />
      ))}
      <Route path="*" element={<Placeholder route={{ path: '*', label: 'Page not found', section: 'public', tag: 'HACKATHON', screen: 'placeholder' }} />} />
    </Routes>
  );
}
