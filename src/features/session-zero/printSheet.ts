import type { InvestigatorEntity } from '@/db/schema';
import { deriveAll, skillTiers } from '@/domain/cocRules';

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

/**
 * Generate a printable investigator sheet in a new window (section 13).
 * The sheet is player-safe: it intentionally OMITS `masterNotes`.
 */
export function printInvestigatorSheet(inv: InvestigatorEntity): void {
  const d = deriveAll(inv.characteristics);
  const chars = (Object.keys(inv.characteristics) as Array<keyof typeof inv.characteristics>)
    .map((k) => {
      const t = skillTiers(inv.characteristics[k]);
      return `<div class="char"><b>${k}</b><span>${inv.characteristics[k]}</span><small>${t.hard} / ${t.extreme}</small></div>`;
    })
    .join('');
  const skills = inv.skills
    .map((s) => {
      const t = skillTiers(s.value);
      return `<li><span>${esc(s.name)}</span><b>${s.value}</b><small>${t.hard}/${t.extreme}</small></li>`;
    })
    .join('');

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>Ficha — ${esc(inv.name)}</title>
<style>
  body { font-family: Georgia, serif; color: #1a1a1a; padding: 24px; max-width: 760px; margin: auto; }
  h1 { margin: 0 0 2px; } .sub { color: #555; margin: 0 0 16px; }
  .chars { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
  .char { border: 1px solid #999; border-radius: 6px; padding: 6px; text-align: center; }
  .char span { display: block; font-size: 22px; } .char small { color: #777; }
  .derived { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0; }
  .derived span { border: 1px solid #999; border-radius: 6px; padding: 4px 8px; }
  ul.skills { list-style: none; padding: 0; columns: 2; }
  ul.skills li { display: flex; justify-content: space-between; gap: 6px; border-bottom: 1px dotted #ccc; padding: 2px 0; }
  ul.skills small { color: #777; }
  .section { margin-top: 14px; } .section h2 { font-size: 15px; border-bottom: 1px solid #999; }
  @media print { button { display: none; } }
</style></head><body>
  <button onclick="window.print()">Imprimir / salvar PDF</button>
  <h1>${esc(inv.name)}</h1>
  <p class="sub">${esc(inv.occupation)} · ${inv.age} anos · jogador: ${esc(inv.playerName || '—')}</p>
  <p><i>${esc(inv.concept)}</i></p>

  <div class="chars">${chars}</div>
  <div class="derived">
    <span>PV ${d.PV}</span><span>PM ${d.PM}</span><span>SAN ${d.SAN}</span>
    <span>Sorte ${inv.derived.Sorte}</span><span>MOV ${d.Movimento}</span>
    <span>Corpo ${d.Corpo}</span><span>Bônus de Dano ${d.BonusDeDano}</span>
  </div>

  <div class="section"><h2>Perícias</h2><ul class="skills">${skills}</ul></div>
  <div class="section"><h2>Antecedentes</h2><p>${esc(inv.backstory)}</p></div>
  <div class="section"><h2>Equipamento</h2><p>${esc(inv.equipment)}</p></div>
  <div class="section"><h2>Gancho</h2><p>${esc(inv.hook)}</p></div>
</body></html>`;

  const win = window.open('', '_blank', 'width=820,height=900');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
