import { createHashRouter } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { MapScreen } from './features/map/MapScreen';
import { NpcsScreen } from './features/npcs/NpcsScreen';
import { FactionsScreen } from './features/factions/FactionsScreen';
import { PlotsScreen } from './features/plots/PlotsScreen';
import { CluesScreen } from './features/clues/CluesScreen';
import { HandoutsScreen } from './features/handouts/HandoutsScreen';
import { JournalScreen } from './features/journal/JournalScreen';
import { GraphScreen } from './features/graph/GraphScreen';
import { SessionZeroScreen } from './features/session-zero/SessionZeroScreen';
import { PlaceholderScreen } from './components/PlaceholderScreen';

/**
 * Hash router so the app works when opened straight from the filesystem.
 *
 * This is a Keeper-only, offline app: there is deliberately NO player-facing
 * route, window or sync channel. Everything lives inside the Keeper shell.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <MapScreen /> },
      { path: 'npcs', element: <NpcsScreen /> },
      { path: 'faccoes', element: <FactionsScreen /> },
      { path: 'tramas', element: <PlotsScreen /> },
      { path: 'pistas', element: <CluesScreen /> },
      { path: 'handouts', element: <HandoutsScreen /> },
      { path: 'grafo', element: <GraphScreen /> },
      { path: 'diario', element: <JournalScreen /> },
      { path: 'sessao-zero', element: <SessionZeroScreen /> },
      { path: 'config', element: <PlaceholderScreen title="Configurações" phase="Fase 5" /> },
    ],
  },
]);
