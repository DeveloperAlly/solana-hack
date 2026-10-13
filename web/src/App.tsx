import { LiveJourneyProvider, LiveJourneyScreen } from './flows/journey-live/LiveJourney';
import { journeySteps } from './screens/journey/paths';
import { Preview } from './screens/preview/Preview';
import type { ArtboardName } from './config/artboards';
import { Outlet, Route, Routes } from 'react-router';
import { routes } from './config/routes';
import { Placeholder } from './screens/placeholder/Placeholder';
import { Workbench } from './system/Workbench';
import { SignIn } from './screens/signin/SignIn';
import { Build } from './screens/build/Build';
import { RequireAuth } from './lib/auth';
import { Create } from './screens/create/Create';
import { Verify } from './screens/verify/Verify';
import { Ledger } from './screens/ledger/Ledger';
import { Home } from './screens/hub/Home';
import { Brand } from './screens/hub/Brand';
import { Settings } from './screens/hub/Settings';
import { ComingSoon } from './screens/hub/ComingSoon';
import { HowItWorks } from './screens/public/HowItWorks';
import { GalleryIndex, GalleryScreen } from './gallery/Gallery';

const previewBoards: Record<string, ArtboardName> = { '/distribute': 'Platforms', '/verify-home': 'Verify-Home', '/grow': 'Grow-Home', '/learn': 'Analytics', '/analytics': 'Analytics', '/inbox': 'Inbox-All' };

export function App() {
  return (
    <Routes>
      <Route element={<LiveJourneyProvider><Outlet /></LiveJourneyProvider>}>
        <Route path="/" element={<LiveJourneyScreen target="main" />} />
        {journeySteps.map(step => <Route key={step.id} path={`/journey/${step.id}`} element={<LiveJourneyScreen target={step.id} />} />)}
      </Route>
      {routes.filter(r => r.screen !== 'landing').map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={
            r.screen === 'workbench' ? <Workbench />
            : r.screen === 'signin' ? <SignIn />
            : r.screen === 'build' ? <RequireAuth><Build /></RequireAuth>
            : r.screen === 'create' ? <RequireAuth><Create /></RequireAuth>
            : r.screen === 'verify' ? <Verify />
            : r.screen === 'ledger' ? <Ledger />
            : r.screen === 'how' ? <HowItWorks />
            : r.screen === 'gallery' ? <GalleryIndex />
            : r.screen === 'gallery-screen' ? <GalleryScreen />
            : r.screen === 'home' ? <RequireAuth><Home /></RequireAuth>
            : r.screen === 'brand' ? <RequireAuth><Brand /></RequireAuth>
            : r.screen === 'settings' ? <RequireAuth><Settings /></RequireAuth>
            : r.screen === 'preview' ? <Preview artboard={previewBoards[r.path]} />
            : r.screen === 'soon' ? <RequireAuth><ComingSoon route={r} /></RequireAuth>
            : <Placeholder route={r} />
          }
        />
      ))}
      <Route path="*" element={<Placeholder route={{ path: '*', label: 'Page not found', section: 'public', tag: 'HACKATHON', screen: 'placeholder' }} />} />
    </Routes>
  );
}
