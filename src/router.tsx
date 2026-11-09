import { createHashRouter } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { MapScreen } from './features/map/MapScreen';
import { NpcsScreen } from './features/npcs/NpcsScreen';
import { FactionsScreen } from './features/factions/FactionsScreen';
import { PlotsScreen } from './features/plots/PlotsScreen';
import { CluesScreen } from './features/clues/CluesScreen';
import { HandoutsScreen } from './features/handouts/HandoutsScreen';
import { JournalScreen } from './features/journal/JournalScreen';
import { PlaceholderScreen } from './components/PlaceholderScreen';

/**
 * Hash router so the app works when opened from the filesystem and so the
 * Player View can live on a separate route/window.
 *
 * NOTE (section 13): there is intentionally NO route for Session Zero that is
 * reachable from the Player View. Session Zero lives only inside the Keeper
 * app shell and is never linked from /jogador.
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
      { path: 'grafo', element: <PlaceholderScreen title="Grafo de Conexões" phase="Fase 4" /> },
      { path: 'diario', element: <JournalScreen /> },
      { path: 'sessao-zero', element: <PlaceholderScreen title="Sessão 0" phase="Fase 7" /> },
      { path: 'config', element: <PlaceholderScreen title="Configurações" phase="Fase 5" /> },
    ],
  },
  // Player View lives on its own route/window (Fase 5).
  { path: '/jogador', element: <PlaceholderScreen title="Visão do Jogador" phase="Fase 5" standalone /> },
]);
