import { visit } from 'unist-util-visit';
import type { Root, RootContent, Paragraph, Text } from 'mdast';

/**
 * A tiny remark plugin that turns fenced Keeper directives into custom nodes
 * the renderer can style:
 *
 *   :::segredo ... :::    -> Keeper-only (red box; NEVER shown in Player View)
 *   :::teste ... :::      -> mechanics / skill test
 *   :::sanidade ... :::   -> Sanity loss
 *
 * Read-aloud uses plain markdown blockquotes (`> ...`), which we style via the
 * component map — no plugin needed for that.
 *
 * The directive block spans from a `:::name` line to the next `:::` line.
 */

export type KeeperDirectiveKind = 'segredo' | 'teste' | 'sanidade';

export interface KeeperDirectiveNode {
  type: 'keeperDirective';
  kind: KeeperDirectiveKind;
  value: string;
  data?: { hName: string; hProperties: Record<string, unknown> };
}

const OPEN_RE = /^:::(segredo|teste|sanidade)\s*$/;
const CLOSE_RE = /^:::\s*$/;

function paragraphText(node: RootContent): string | null {
  if (node.type !== 'paragraph') return null;
  const p = node as Paragraph;
  if (p.children.length !== 1 || p.children[0].type !== 'text') return null;
  return (p.children[0] as Text).value;
}

export function remarkKeeperDirectives() {
  return (tree: Root) => {
    const children = tree.children;
    const next: RootContent[] = [];

    for (let i = 0; i < children.length; i += 1) {
      const node = children[i];
      const text = paragraphText(node);
      const openMatch = text ? OPEN_RE.exec(text.split('\n')[0]) : null;

      if (text && openMatch) {
        // Collect lines belonging to this directive, possibly within the same
        // paragraph (markdown keeps soft breaks) or across paragraphs.
        const kind = openMatch[1] as KeeperDirectiveKind;
        const lines = text.split('\n').slice(1); // drop the opening fence
        const body: string[] = [];
        let closed = false;

        for (const line of lines) {
          if (CLOSE_RE.test(line)) {
            closed = true;
            break;
          }
          body.push(line);
        }

        // If not closed within this paragraph, consume following nodes.
        let j = i;
        while (!closed && j + 1 < children.length) {
          j += 1;
          const t = paragraphText(children[j]);
          if (t == null) {
            body.push('');
            continue;
          }
          const tLines = t.split('\n');
          let done = false;
          for (const line of tLines) {
            if (CLOSE_RE.test(line)) {
              done = true;
              break;
            }
            body.push(line);
          }
          if (done) {
            closed = true;
            break;
          }
          body.push('');
        }

        const directive: KeeperDirectiveNode = {
          type: 'keeperDirective',
          kind,
          value: body.join('\n').trim(),
          data: {
            hName: 'div',
            hProperties: { 'data-keeper-directive': kind },
          },
        };
        next.push(directive as unknown as RootContent);
        i = closed ? j : i;
      } else {
        next.push(node);
      }
    }

    tree.children = next;
  };
}

// keep the visit import referenced for future node-level transforms
void visit;
