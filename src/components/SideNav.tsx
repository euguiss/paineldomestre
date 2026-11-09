import { NavLink } from 'react-router-dom';
import {
  Map as MapIcon,
  Users,
  Flag,
  Clapperboard,
  Search,
  FileImage,
  Share2,
  BookOpen,
  Settings,
  GraduationCap,
  DownloadCloud,
} from 'lucide-react';

const ITEMS = [
  { to: '/', label: 'Mapa', icon: MapIcon, end: true },
  { to: '/npcs', label: 'NPCs', icon: Users },
  { to: '/faccoes', label: 'Facções', icon: Flag },
  { to: '/tramas', label: 'Tramas', icon: Clapperboard },
  { to: '/pistas', label: 'Pistas', icon: Search },
  { to: '/handouts', label: 'Handouts', icon: FileImage },
  { to: '/grafo', label: 'Grafo', icon: Share2 },
  { to: '/diario', label: 'Diário', icon: BookOpen },
  { to: '/sessao-zero', label: 'Sessão 0', icon: GraduationCap },
  { to: '/importar', label: 'Importar', icon: DownloadCloud },
  { to: '/config', label: 'Config', icon: Settings },
];

/** Left navigation rail. */
export function SideNav() {
  return (
    <nav className="flex w-[84px] shrink-0 flex-col items-stretch gap-0.5 overflow-y-auto border-r border-border bg-surface px-1.5 py-2">
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={label}
          className={({ isActive }) =>
            `group relative flex flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-[11px] font-medium transition-colors ${
              isActive ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-surface-2 hover:text-text'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-accent" />}
              <Icon size={20} aria-hidden />
              <span className="leading-none">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
