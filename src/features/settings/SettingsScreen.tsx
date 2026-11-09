import { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, Trash2 } from 'lucide-react';
import { ScreenHeader, Button } from '@/components/ui';
import { exportWorld, importWorld, downloadBackup } from '@/backup/worldBackup';
import { wipeAll, installSeed } from '@/seed/seedData';
import { useUiStore } from '@/state/uiStore';

/** Configurações: backup export/import, theme, reset (section 6.12). */
export function SettingsScreen() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  async function handleExport() {
    setStatus('Gerando backup…');
    const backup = await exportWorld();
    downloadBackup(backup);
    setStatus('Backup baixado.');
  }

  async function handleImportFile(file: File) {
    setStatus('Importando…');
    try {
      const json = JSON.parse(await file.text());
      const result = await importWorld(json);
      setStatus(result.message);
    } catch {
      setStatus('Arquivo JSON inválido.');
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ScreenHeader title="Configurações" />
      <div className="space-y-6 p-4">
        <section>
          <h2 className="mb-1 font-serif text-lg">Backup do mundo (JSON)</h2>
          <p className="mb-3 text-sm text-muted">
            Exporta ou importa <strong>tudo</strong> — mapas, locais, NPCs, tramas, pistas, handouts,
            mesas, sessões e Sessão 0 — com as imagens embutidas em base64.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" onClick={handleExport}><Download size={14} className="mr-1 inline" /> Exportar mundo</Button>
            <Button onClick={() => fileInput.current?.click()}><Upload size={14} className="mr-1 inline" /> Importar mundo</Button>
            <input ref={fileInput} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImportFile(f); e.target.value = ''; }} />
          </div>
          <div className="mt-2 flex items-start gap-1 rounded border border-secret/30 bg-secret/10 p-2 text-xs text-secret">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <span>
              O backup pode conter material protegido por direitos autorais (textos e imagens que você
              importou). Ele é para uso pessoal — <strong>não compartilhe</strong>. Importar substitui o mundo atual.
            </span>
          </div>
          {status && <p className="mt-2 text-sm text-accent">{status}</p>}
        </section>

        <section>
          <h2 className="mb-1 font-serif text-lg">Tema</h2>
          <Button onClick={toggleTheme}>Alternar para tema {theme === 'dark' ? 'claro' : 'escuro'}</Button>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-lg">Atalhos</h2>
          <ul className="text-sm text-muted">
            <li><kbd className="rounded border border-border px-1">Ctrl/Cmd</kbd> + <kbd className="rounded border border-border px-1">K</kbd> — busca global</li>
            <li><kbd className="rounded border border-border px-1">N</kbd> — nota rápida (durante a sessão)</li>
            <li><kbd className="rounded border border-border px-1">Esc</kbd> — fechar diálogos</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-serif text-lg">Dados de exemplo</h2>
          <div className="flex gap-2">
            <Button onClick={async () => { if (confirm('Recarregar o conteúdo de exemplo? Apaga o mundo atual.')) { await wipeAll(); await installSeed(); setStatus('Exemplo recarregado.'); } }}>Recarregar exemplo</Button>
            <Button variant="danger" onClick={async () => { if (confirm('Apagar tudo e começar do zero?')) { await wipeAll(); setStatus('Tudo apagado.'); } }}><Trash2 size={14} className="mr-1 inline" /> Começar do zero</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
