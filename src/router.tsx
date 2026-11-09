import { createHashRouter } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { MapScreen } from './features/map/MapScreen';
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
      { path: 'npcs', element: <PlaceholderScreen title="NPCs" phase="Fase 2" /> },
      { path: 'faccoes', element: <PlaceholderScreen title="Facções" phase="Fase 2" /> },
      { path: 'tramas', element: <PlaceholderScreen title="Quadro de Tramas" phase="Fase 2 / 4" /> },
      { path: 'pistas', element: <PlaceholderScreen title="Gerenciador de Pistas" phase="Fase 2" /> },
      { path: 'handouts', element: <PlaceholderScreen title="Biblioteca de Handouts" phase="Fase 3" /> },
      { path: 'grafo', element: <PlaceholderScreen title="Grafo de Conexões" phase="Fase 4" /> },
      { path: 'diario', element: <PlaceholderScreen title="Diário / Linha do Tempo" phase="Fase 3" /> },
      { path: 'sessao-zero', element: <PlaceholderScreen title="Sessão 0" phase="Fase 7" /> },
      { path: 'config', element: <PlaceholderScreen title="Configurações" phase="Fase 5" /> },
    ],
  },
  // Player View lives on its own route/window (Fase 5).
  { path: '/jogador', element: <PlaceholderScreen title="Visão do Jogador" phase="Fase 5" standalone /> },
]);
