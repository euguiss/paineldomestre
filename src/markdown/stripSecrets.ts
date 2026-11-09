/**
 * Shared definition of Keeper-only directive blocks, so the renderer and the
 * Player View projections strip exactly the same content.
 *
 * Matches a fenced block opened by `:::segredo`, `:::teste` or `:::sanidade`
 * and closed by a line with `:::`.
 */
export const KEEPER_DIRECTIVE_RE = /:::(?:segredo|teste|sanidade)\b[\s\S]*?:::/g;
