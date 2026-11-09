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
    <nav className="flex w-20 shrink-0 flex-col items-stretch gap-1 border-r border-border bg-surface py-2">
      {ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-1 py-2 text-[11px] ${
              isActive ? 'text-accent' : 'text-muted hover:text-text'
            }`
          }
        >
          <Icon size={20} aria-hidden />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
