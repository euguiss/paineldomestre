/**
 * 100% original seed content (pt-BR) that demonstrates every feature.
 *
 * Nothing here is copied from published Call of Cthulhu products. Names,
 * places and texts are invented for this demo. The Keeper can wipe it all
 * with one click ("Começar do zero").
 *
 * The seed is defined with stable string keys (not uuids) so references are
 * easy to read; `buildSeed()` resolves them to real uuids at install time.
 */

import { newId, now } from '@/db/ids';
import { db, SCHEMA_VERSION } from '@/db/database';
import { putBlob } from '@/db/blobs';
import { innsmouthSvg, arkhamSvg, svgToBlob, SEED_MAP_SIZE } from './svgMaps';
import type {
  MapEntity,
  LocationEntity,
  NpcEntity,
  FactionEntity,
  PlotEntity,
  LocationPlotLayer,
  SceneCardEntity,
  ClueEntity,
  HandoutEntity,
  TableEntity,
  SessionEntity,
  InvestigatorEntity,
  SessionZeroEntity,
  EventEntity,
} from '@/db/schema';

const SEED_META_KEY = 'seedInstalled';

function base() {
  const ts = now();
  return { id: newId(), createdAt: ts, updatedAt: ts, tags: [] as string[], notes: '' };
}

/** Build and persist the whole seed inside one transaction. */
export async function installSeed(): Promise<void> {
  // --- Maps (images stored as blobs) ---
  const innsmouthBlob = await putBlob(svgToBlob(innsmouthSvg()));
  const arkhamBlob = await putBlob(svgToBlob(arkhamSvg()));

  const innsmouth: MapEntity = {
    ...base(),
    name: 'Innsmouth',
    imageBlobId: innsmouthBlob,
    width: SEED_MAP_SIZE.width,
    height: SEED_MAP_SIZE.height,
    scaleNote: 'Mapa ilustrativo; cada quadra ~120 m.',
  };
  const arkham: MapEntity = {
    ...base(),
    name: 'Arkham',
    imageBlobId: arkhamBlob,
    width: SEED_MAP_SIZE.width,
    height: SEED_MAP_SIZE.height,
  };

  // --- Plots (declared early so layers can reference ids) ---
  const plotMare: PlotEntity = {
    ...base(),
    name: 'A Maré que Lembra',
    sourceModule: 'Cenário próprio (demo)',
    threatLevel: 3,
    hiddenTruth:
      'Uma confraria de pescadores faz pactos com algo que dorme sob o banco de areia. A cada maré de equinócio, exigem um "convidado".',
    antagonists: 'A Irmandade da Âncora Negra; o velho Teobaldo Marsh.',
    state: 'ativa',
    activationTrigger: 'Os investigadores perguntam sobre os desaparecimentos no porto.',
    clock: {
      segments: 6,
      filled: 1,
      advanceRules: [
        'Avança 1 quando a Irmandade percebe que estão sendo investigados.',
        'Avança 2 ao chegar a maré de equinócio.',
      ],
    },
    scheduledBeats: [
      {
        atSegment: 3,
        title: 'Um aviso nas docas',
        description:
          'Um bote some durante a noite; encontram-se marcas de maré alta onde não deveria haver.',
        effects: [],
      },
      {
        atSegment: 6,
        title: 'A maré sobe cedo',
        description: 'A confraria se reúne no armazém para o ritual. É agora ou nunca.',
        effects: [{ type: 'setPlotState', plotId: '', state: 'escalando' }],
      },
    ],
    conclusions: [],
  };
  const plotMareConc1 = {
    id: newId(),
    title: 'Descobrir o pacto da Irmandade',
    description: 'Entender que os desaparecimentos são oferendas deliberadas.',
  };
  const plotMareConc2 = {
    id: newId(),
    title: 'Identificar o local do ritual',
    description: 'Localizar o armazém usado nas marés de equinócio.',
  };
  plotMare.conclusions = [plotMareConc1, plotMareConc2];
  // fix self-reference in beat effect
  plotMare.scheduledBeats[1].effects = [
    { type: 'setPlotState', plotId: plotMare.id, state: 'escalando' },
  ];

  const plotLentes: PlotEntity = {
    ...base(),
    name: 'As Lentes de Arkham',
    sourceModule: 'Cenário próprio (demo)',
    threatLevel: 2,
    hiddenTruth:
      'Um ótico fabrica lentes que revelam presenças normalmente invisíveis — e atraíram a atenção de quem não quer ser visto.',
    antagonists: 'O comprador anônimo das lentes.',
    state: 'ativa',
    clock: {
      segments: 4,
      filled: 0,
      advanceRules: ['Avança 1 a cada noite em que uma lente fica exposta à lua cheia.'],
    },
    scheduledBeats: [
      {
        atSegment: 2,
        title: 'A vitrine quebrada',
        description: 'A ótica é arrombada; só as lentes especiais somem.',
        effects: [],
      },
    ],
    conclusions: [
      {
        id: newId(),
        title: 'Entender o que as lentes revelam',
        description: 'Perceber que as lentes tornam visível algo que caminha entre as pessoas.',
      },
    ],
  };

  const plotSino: PlotEntity = {
    ...base(),
    name: 'O Sino Submerso',
    sourceModule: 'Cenário próprio (demo)',
    threatLevel: 4,
    hiddenTruth:
      'Um sino antigo, afundado na enseada, toca sozinho antes de cada tragédia. Quem o ouve três vezes começa a sonhar com a água.',
    antagonists: 'Nenhum humano — ainda. A própria maré.',
    state: 'dormente',
    activationTrigger: 'Alguém recupera o registro do naufrágio no porto.',
    clock: {
      segments: 8,
      filled: 0,
      advanceRules: ['Avança 1 cada vez que um investigador ouve o sino.'],
    },
    scheduledBeats: [],
    conclusions: [
      {
        id: newId(),
        title: 'Rastrear a origem do sino',
        description: 'Ligar o som ao naufrágio esquecido sob a enseada.',
      },
    ],
  };

  // --- Factions ---
  const facIrmandade: FactionEntity = {
    ...base(),
    name: 'Irmandade da Âncora Negra',
    goals: 'Manter o pacto com o que dorme sob a areia e esconder os desaparecimentos.',
    resources: 'Controle informal do porto, botes, e silêncio da vizinhança.',
    memberNpcIds: [],
    locationIds: [],
    symbol: 'Uma âncora cruzada por três ondas.',
    layers: [{ plotId: plotMare.id, whatChanges: 'Membros ficam hostis e vigilantes.' }],
  };
  const facSociedade: FactionEntity = {
    ...base(),
    name: 'Sociedade de Óptica de Arkham',
    goals: 'Avançar o estudo de lentes e instrumentos; alguns membros vão longe demais.',
    resources: 'Oficina, financiamento discreto, contatos na universidade.',
    memberNpcIds: [],
    locationIds: [],
    layers: [{ plotId: plotLentes.id, whatChanges: 'A Sociedade passa a esconder registros.' }],
  };

  // --- NPCs ---
  const npcTeobaldo: NpcEntity = {
    ...base(),
    name: 'Teobaldo Marsh',
    appearance: 'Velho pescador de ombros largos, olhos muito separados e pele salgada.',
    voiceAndMannerisms: 'Fala devagar, com pausas longas; evita olhar o mar ao falar da maré.',
    typicalLines: [
      '“A enseada dá e a enseada cobra, moço.”',
      '“Não convém perguntar quem saiu no último bote.”',
    ],
    factionIds: [facIrmandade.id],
    statBlock: {
      markdown: 'Pescador idoso, surpreendentemente forte. Conhece cada corrente da enseada.',
      FOR: 65,
      CON: 60,
      TAM: 70,
      DES: 45,
      APA: 40,
      INT: 60,
      POD: 70,
      EDU: 40,
      SAN: 35,
      PV: 13,
      skills: [
        { name: 'Pilotar (Barco)', value: 70 },
        { name: 'Intimidação', value: 55 },
        { name: 'Ocultismo', value: 40 },
      ],
      attacks: [
        { name: 'Gancho de pesca', value: 55, damage: '1d6+BD', description: 'Improvisado, mas cruel em espaços fechados.' },
        { name: 'Lampião', value: 40, damage: '1d4 + fogo', description: 'Pode atirar para incendiar redes e piche.' },
      ],
    },
    schedule: [
      { period: 'manha', locationId: '', activity: 'Remenda redes no cais.' },
      { period: 'tarde', locationId: '', activity: 'Bebe na taverna, de olho em quem chega.' },
      { period: 'noite', locationId: '', activity: 'Fica no armazém; nas marés, lidera a reunião.' },
    ],
    status: 'vivo',
    isKnownToPlayers: false,
    layers: [
      {
        plotId: plotMare.id,
        knows: 'Quem foi "convidado" e quando; o calendário das marés.',
        hides: 'Que ele mesmo escolhe os convidados.',
        revealsIfPressed: 'Admite que "a enseada escolhe", desviando a culpa.',
      },
      {
        plotId: plotSino.id,
        knows: 'Que o sino toca antes das tragédias.',
        hides: 'Que já o ouviu três vezes.',
        revealsIfPressed: 'Fala do sino como "história de pescador".',
        activationCondition: { kind: 'plotState', plotId: plotSino.id, op: 'isNot', value: 'dormente' },
      },
    ],
  };

  const npcCloe: NpcEntity = {
    ...base(),
    name: 'Cloé Ferran',
    appearance: 'Ótica meticulosa, avental manchado de pó de vidro, lupa pendurada no pescoço.',
    voiceAndMannerisms: 'Rápida e precisa; limpa as lentes quando fica nervosa.',
    typicalLines: ['“Vidro não mente. Só mostra o que estava lá o tempo todo.”'],
    factionIds: [facSociedade.id],
    statBlock: {
      markdown: 'Artesã brilhante. Mãos firmes, nervos menos.',
      FOR: 45,
      CON: 55,
      TAM: 50,
      DES: 75,
      APA: 60,
      INT: 80,
      POD: 65,
      EDU: 75,
      SAN: 65,
      PV: 10,
      skills: [
        { name: 'Arte/Ofício (Óptica)', value: 80 },
        { name: 'Ciência (Física)', value: 55 },
      ],
      attacks: [
        { name: 'Estilete de polir', value: 45, damage: '1d4', description: 'Pequena lâmina de bancada; usa só se encurralada.' },
      ],
    },
    schedule: [
      { period: 'manha', locationId: '', activity: 'Abre a ótica e pole lentes.' },
      { period: 'tarde', locationId: '', activity: 'Atende encomendas.' },
      { period: 'noite', locationId: '', activity: 'Fecha cedo; testa lentes "especiais".' },
    ],
    status: 'vivo',
    isKnownToPlayers: true,
    layers: [
      {
        plotId: plotLentes.id,
        knows: 'Que uma lente sua revela presenças invisíveis.',
        hides: 'Quem pagou caro pela lente e por quê.',
        revealsIfPressed: 'Mostra a lente, assustada com o que viu através dela.',
      },
    ],
  };

  // --- Locations (Innsmouth) ---
  const locArmazem: LocationEntity = {
    ...base(),
    name: 'Armazém da Enseada',
    mapId: innsmouth.id,
    geometry: { type: 'point', x: 540, y: 980 },
    kind: 'armazem',
    district: 'Porto',
    baseDescription:
      'Um galpão de madeira enegrecida junto ao terceiro píer. Cheira a maresia, piche e algo mais doce por baixo.',
    readAloud: {
      primeiraVisita:
        '> A maré baixa expõe estacas cobertas de cracas sob o armazém. A porta range e, lá dentro, redes penduradas gotejam água salgada num ritmo que lembra um relógio.',
      retorno:
        '> O armazém está como o deixaram — exceto por uma poça nova no centro do piso, perfeitamente redonda, que não deveria estar ali.',
      dia: '> Pela luz do dia, o galpão parece apenas velho e úmido: caixas, cordas e o zumbido de moscas sobre uma pilha de peixe.',
      noite:
        '> À noite, a água bate forte nas estacas e vozes abafadas parecem subir pelo assoalho. Uma lanterna acesa lá dentro se apaga quando vocês chegam.',
      chuva:
        '> A chuva transforma o telhado num tambor. Dentro, tudo pinga, e o cheiro doce fica mais forte, quase adocicado demais.',
      generico: '> Um armazém portuário, úmido e mal iluminado, perto do terceiro píer.',
    },
    sensoryDetails: [
      'Um gotejar constante que não acompanha a chuva lá fora.',
      'Marcas de maré alta na parede interna — bem acima do nível possível.',
      'Uma âncora cruzada por três ondas, riscada a canivete numa viga.',
      'Cheiro doce de água parada por baixo do cheiro de piche.',
    ],
    discovered: false,
    iconKey: 'warehouse',
  };

  const locCais: LocationEntity = {
    ...base(),
    name: 'Terceiro Píer',
    mapId: innsmouth.id,
    geometry: { type: 'point', x: 540, y: 1060 },
    kind: 'porto',
    district: 'Porto',
    baseDescription: 'Um píer de tábuas gastas, o mais afastado da capitania.',
    readAloud: {
      generico: '> Tábuas escorregadias avançam sobre a água escura. Botes amarrados batem uns nos outros.',
    },
    sensoryDetails: ['O ranger dos botes.', 'Óleo iridescente boiando entre as estacas.'],
    discovered: true,
    iconKey: 'anchor',
  };

  const locTaverna: LocationEntity = {
    ...base(),
    name: 'Taverna Maré Mansa',
    mapId: innsmouth.id,
    geometry: { type: 'point', x: 280, y: 420 },
    kind: 'taverna',
    district: 'Centro Velho',
    baseDescription: 'Uma taverna baixa de teto enfumaçado; os habitués calam quando forasteiros entram.',
    readAloud: {
      generico: '> Lampiões a óleo, bancos tortos e um silêncio que cai quando a porta abre.',
    },
    sensoryDetails: ['Peixe frito e fumo barato.', 'Um relógio de parede parado às 3h07.'],
    discovered: true,
    iconKey: 'beer',
  };

  const locCapela: LocationEntity = {
    ...base(),
    name: 'Capela de São Bartolomeu',
    mapId: innsmouth.id,
    geometry: { type: 'point', x: 1160, y: 300 },
    kind: 'igreja',
    district: 'Colina',
    baseDescription: 'Uma capela abandonada na colina, com o sino removido do campanário.',
    readAloud: { generico: '> O campanário está vazio; só restam as correntes enferrujadas que seguravam o sino.' },
    sensoryDetails: ['Eco longo demais para o tamanho da nave.'],
    discovered: false,
    iconKey: 'church',
  };

  const locMercado: LocationEntity = {
    ...base(),
    name: 'Mercado do Peixe',
    mapId: innsmouth.id,
    geometry: { type: 'point', x: 320, y: 620 },
    kind: 'loja',
    district: 'Centro Velho',
    baseDescription: 'Bancas de peixe sob um toldo remendado.',
    readAloud: { generico: '> Gelo derretendo, escamas no chão e vendedores de poucas palavras.' },
    sensoryDetails: ['Gritaria matinal; silêncio à tarde.'],
    discovered: true,
    iconKey: 'store',
  };

  const locCapitania: LocationEntity = {
    ...base(),
    name: 'Capitania dos Portos',
    mapId: innsmouth.id,
    geometry: { type: 'point', x: 1120, y: 980 },
    kind: 'instituicao',
    district: 'Porto',
    baseDescription: 'Um prédio de pedra onde se guardam os registros de embarcações e naufrágios.',
    readAloud: { generico: '> Arquivos empoeirados, um balcão alto e um funcionário que claramente prefere o silêncio.' },
    sensoryDetails: ['Cheiro de papel mofado e tinta.'],
    discovered: true,
    iconKey: 'building',
  };

  // --- Districts (polygons) ---
  const distPorto: LocationEntity = {
    ...base(),
    name: 'Distrito do Porto',
    mapId: innsmouth.id,
    geometry: {
      type: 'polygon',
      points: [
        { x: 60, y: 880 },
        { x: 1540, y: 880 },
        { x: 1540, y: 1180 },
        { x: 60, y: 1180 },
      ],
    },
    kind: 'distrito',
    baseDescription: 'A faixa portuária de Innsmouth, dominada pela Irmandade.',
    readAloud: {},
    sensoryDetails: [],
    discovered: true,
    iconKey: 'map',
  };
  const distColina: LocationEntity = {
    ...base(),
    name: 'Distrito da Colina',
    mapId: innsmouth.id,
    geometry: {
      type: 'polygon',
      points: [
        { x: 980, y: 40 },
        { x: 1540, y: 40 },
        { x: 1540, y: 380 },
        { x: 980, y: 380 },
      ],
    },
    kind: 'distrito',
    baseDescription: 'A colina residencial, mais calada e devota.',
    readAloud: {},
    sensoryDetails: [],
    discovered: false,
    iconKey: 'map',
  };

  // --- Locations (Arkham) ---
  const locOtica: LocationEntity = {
    ...base(),
    name: 'Ótica Ferran',
    mapId: arkham.id,
    geometry: { type: 'point', x: 640, y: 320 },
    kind: 'loja',
    district: 'Centro',
    baseDescription: 'Uma ótica estreita com vitrine de lentes polidas que captam cada feixe de luz.',
    readAloud: {
      generico: '> Prateleiras de lentes brilham como olhos. Ao fundo, uma bancada cheia de limalha de vidro.',
      noite: '> A loja está fechada, mas uma lamparina se move atrás da cortina dos fundos.',
    },
    sensoryDetails: ['Cheiro de resina e metal polido.', 'Um leve zumbido de vidro ressoando.'],
    discovered: true,
    iconKey: 'store',
  };
  const locBiblioteca: LocationEntity = {
    ...base(),
    name: 'Biblioteca da Universidade',
    mapId: arkham.id,
    geometry: { type: 'point', x: 820, y: 940 },
    kind: 'instituicao',
    district: 'Campus',
    baseDescription: 'A grande biblioteca; seção de periódicos e mapas antigos no subsolo.',
    readAloud: { generico: '> Fileiras de estantes se perdem na penumbra. O subsolo cheira a couro e poeira.' },
    sensoryDetails: ['Silêncio pesado.', 'Lâmpadas que piscam no subsolo.'],
    discovered: true,
    iconKey: 'building',
  };
  const locPraca: LocationEntity = {
    ...base(),
    name: 'Praça da Independência',
    mapId: arkham.id,
    geometry: { type: 'point', x: 980, y: 420 },
    kind: 'outro',
    district: 'Centro',
    baseDescription: 'Praça central com um coreto e muitos pombos.',
    readAloud: { generico: '> Um coreto descascado, bancos de ferro e o burburinho da cidade.' },
    sensoryDetails: ['Pombos.', 'Vendedor de jornais na esquina.'],
    discovered: true,
    iconKey: 'map',
  };
  const locDelegacia: LocationEntity = {
    ...base(),
    name: 'Delegacia Central',
    mapId: arkham.id,
    geometry: { type: 'point', x: 300, y: 980 },
    kind: 'instituicao',
    district: 'Centro',
    baseDescription: 'A delegacia de Arkham, com arquivos de ocorrências.',
    readAloud: { generico: '> Um balcão arranhado, cadeiras duras e o cheiro de café requentado.' },
    sensoryDetails: ['Máquinas de escrever ao fundo.'],
    discovered: true,
    iconKey: 'building',
  };

  // wire NPC schedules & faction members/locations to real ids
  npcTeobaldo.schedule[0].locationId = locCais.id;
  npcTeobaldo.schedule[1].locationId = locTaverna.id;
  npcTeobaldo.schedule[2].locationId = locArmazem.id;
  npcCloe.schedule[0].locationId = locOtica.id;
  npcCloe.schedule[1].locationId = locOtica.id;
  npcCloe.schedule[2].locationId = locOtica.id;

  facIrmandade.memberNpcIds = [npcTeobaldo.id];
  facIrmandade.locationIds = [locArmazem.id, locCais.id, distPorto.id];
  facSociedade.memberNpcIds = [npcCloe.id];
  facSociedade.locationIds = [locOtica.id];

  // --- Location plot layers (two layers on the warehouse) ---
  const layerArmazemMare: LocationPlotLayer = {
    ...base(),
    locationId: locArmazem.id,
    plotId: plotMare.id,
    whatChanges:
      'Quando a trama está ativa, o armazém guarda os preparativos do ritual: giz salgado no chão e um registro de "convidados".',
    readAloudAppend:
      '> No canto, sob uma lona, há um círculo de giz salgado meio apagado — e uma lista de nomes rabiscada, com os três últimos riscados.',
    cluesHere: [],
    sceneCardIds: [],
    activationCondition: { kind: 'plotState', plotId: plotMare.id, op: 'isNot', value: 'dormente' },
  };
  const layerArmazemSino: LocationPlotLayer = {
    ...base(),
    locationId: locArmazem.id,
    plotId: plotSino.id,
    whatChanges:
      'Se a trama do sino despertar, ouve-se um tom grave subir pelo assoalho molhado quando a maré vira.',
    readAloudOverride:
      '> Um som fundo, quase um sino, sobe pelas tábuas encharcadas. Ele para no instante em que vocês prendem a respiração — e recomeça.',
    cluesHere: [],
    sceneCardIds: [],
    activationCondition: {
      kind: 'all',
      conditions: [
        { kind: 'plotState', plotId: plotSino.id, op: 'isNot', value: 'dormente' },
        { kind: 'plotClockFilled', plotId: plotSino.id, op: 'gte', value: 1 },
      ],
    },
  };

  // --- Scene cards (two, on the warehouse) ---
  const sceneReuniao: SceneCardEntity = {
    ...base(),
    title: 'A reunião interrompida',
    plotId: plotMare.id,
    locationId: locArmazem.id,
    trigger: 'Os investigadores entram no armazém durante a noite, na véspera da maré.',
    openingText:
      '> Doze figuras encapuzadas formam um semicírculo diante de uma poça redonda. Teobaldo levanta a mão e todas as cabeças se viram para a porta.',
    whatHappens:
      'A Irmandade tenta expulsar ou "convidar" os investigadores. Teobaldo prefere ameaça velada a violência aberta.',
    outcomes: [
      {
        label: 'Recuar em silêncio',
        description: 'Saem sem confronto, mas são marcados. A Irmandade fica alerta.',
        effects: [{ type: 'advanceClock', plotId: plotMare.id, by: 1 }],
      },
      {
        label: 'Enfrentar',
        description: 'Combate ou fuga caótica; alguém pode cair na água.',
        effects: [{ type: 'setPlotState', plotId: plotMare.id, state: 'escalando' }],
      },
    ],
    repeatable: false,
    used: false,
  };
  const sceneLista: SceneCardEntity = {
    ...base(),
    title: 'A lista de convidados',
    plotId: plotMare.id,
    locationId: locArmazem.id,
    trigger: 'Alguém examina o canto sob a lona com calma.',
    openingText:
      '> A lista tem onze nomes. Três estão riscados. O quarto, ainda por riscar, faz seu sangue gelar: é um nome que vocês conhecem.',
    whatHappens: 'Revela o método da Irmandade e dá um gancho pessoal, se um nome bater com um PJ ou aliado.',
    outcomes: [
      {
        label: 'Levar a lista',
        description: 'Prova física; a Irmandade notará a falta.',
        effects: [{ type: 'advanceClock', plotId: plotMare.id, by: 1 }],
      },
    ],
    repeatable: false,
    used: false,
  };

  // --- Handout (text) ---
  const handoutLista: HandoutEntity = {
    ...base(),
    title: 'Página rasgada: "A conta da maré"',
    textContent:
      'Onze nomes numa caligrafia trêmula. Três riscados com força. No rodapé, a lápis: "o equinócio não espera".',
    clueId: undefined,
    locationId: locArmazem.id,
    deliveries: [],
    playerSafeCaption: 'Uma página rasgada com uma lista de nomes; alguns estão riscados.',
  };

  // --- Clues (3; one is a bridge to the lenses plot) ---
  const clueMarcas: ClueEntity = {
    ...base(),
    text: 'Marcas de maré alta na parede interna do armazém, muito acima do nível possível.',
    plotIds: [plotMare.id],
    locationId: locArmazem.id,
    howToObtain: { method: 'Observar o interior com atenção', difficulty: 'Regular' },
    revealsConclusionId: plotMareConc2.id,
    pointsToPlotIds: [plotMare.id],
    isBridge: false,
    handoutIds: [],
    status: 'nao-descoberta',
  };
  const clueLista: ClueEntity = {
    ...base(),
    text: 'A lista de "convidados" com três nomes riscados.',
    plotIds: [plotMare.id],
    locationId: locArmazem.id,
    howToObtain: { method: 'Procurar sob a lona', difficulty: 'Dificil' },
    revealsConclusionId: plotMareConc1.id,
    pointsToPlotIds: [plotMare.id],
    isBridge: false,
    handoutIds: [handoutLista.id],
    status: 'nao-descoberta',
  };
  const clueLente: ClueEntity = {
    ...base(),
    text:
      'Através de uma lente da ótica de Arkham, vê-se no armazém uma silhueta encharcada que não está lá a olho nu.',
    plotIds: [plotMare.id, plotLentes.id],
    locationId: locArmazem.id,
    howToObtain: { method: 'Usar uma lente especial da Ótica Ferran no local', difficulty: 'Extremo' },
    pointsToPlotIds: [plotMare.id, plotLentes.id],
    isBridge: true,
    handoutIds: [],
    status: 'nao-descoberta',
  };
  handoutLista.clueId = clueLista.id;

  layerArmazemMare.cluesHere = [clueMarcas.id, clueLista.id];
  layerArmazemMare.sceneCardIds = [sceneReuniao.id, sceneLista.id];
  layerArmazemSino.cluesHere = [clueLente.id];

  // --- Table, session, investigators ---
  const table: TableEntity = {
    ...base(),
    name: 'Mesa de Quinta',
    players: [
      { name: 'Ana', characterName: 'Dra. Vieira' },
      { name: 'Bruno', characterName: 'Padre Elias' },
      { name: 'Carla', characterName: 'Repórter Nunes' },
    ],
    inGameDate: '14 de setembro de 1925',
    partyLocationId: locCais.id,
  };

  const session: SessionEntity = {
    ...base(),
    tableId: table.id,
    realDate: '2026-11-05',
    inGameStart: '14 de setembro de 1925, manhã',
    inGameEnd: '14 de setembro de 1925, noite',
    summary: 'O grupo chegou a Innsmouth seguindo o rastro de um desaparecido e visitou o porto.',
    eventIds: [],
  };

  const inv1: InvestigatorEntity = {
    ...base(),
    name: 'Dra. Helena Vieira',
    playerName: 'Ana',
    tableId: table.id,
    concept: 'Médica legista curiosa demais',
    occupation: 'Médica',
    age: 38,
    characteristics: { FOR: 45, CON: 60, TAM: 55, DES: 60, APA: 55, INT: 80, POD: 65, EDU: 85 },
    derived: { PV: 11, PM: 13, SAN: 65, Sorte: 55, Movimento: 7, Corpo: '0', BonusDeDano: 'Nenhum' },
    skills: [
      { name: 'Medicina', value: 70 },
      { name: 'Primeiros Socorros', value: 60 },
      { name: 'Perceber', value: 50 },
    ],
    backstory: 'Trocou um hospital movimentado por perguntas que ninguém queria responder.',
    equipment: 'Maleta médica, bloco de anotações.',
    hook: 'O desaparecido era seu antigo paciente.',
    links: [
      { targetType: 'location', targetId: locCais.id, note: 'Recebeu a última carta do paciente, postada do Terceiro Píer.' },
      { targetType: 'npc', targetId: npcTeobaldo.id, note: 'Teobaldo foi a última pessoa a ver seu paciente.' },
    ],
    status: 'ativo',
    masterNotes: 'Bom motor para a trama da Maré.',
  };
  const inv2: InvestigatorEntity = {
    ...base(),
    name: 'Padre Elias Rocha',
    playerName: 'Bruno',
    tableId: table.id,
    concept: 'Clérigo que perdeu a fé e ganhou perguntas',
    occupation: 'Clérigo',
    age: 51,
    characteristics: { FOR: 50, CON: 55, TAM: 60, DES: 45, APA: 50, INT: 70, POD: 75, EDU: 80 },
    derived: { PV: 11, PM: 15, SAN: 75, Sorte: 50, Movimento: 6, Corpo: '0', BonusDeDano: 'Nenhum' },
    skills: [
      { name: 'História', value: 60 },
      { name: 'Persuasão', value: 55 },
      { name: 'Ocultismo', value: 30 },
    ],
    backstory: 'Serviu numa paróquia à beira-mar antes de vir para Arkham.',
    equipment: 'Bíblia anotada, lanterna.',
    hook: 'Ouviu falar de um sino que "chama" — e não consegue esquecer.',
    links: [
      { targetType: 'location', targetId: locCapela.id, note: 'Quer saber por que removeram o sino da Capela.' },
      { targetType: 'plot', targetId: plotSino.id, note: 'Ligado à trama do Sino Submerso.' },
    ],
    status: 'ativo',
    masterNotes: 'Pode despertar a trama dormente do Sino.',
  };
  const inv3: InvestigatorEntity = {
    ...base(),
    name: 'Marina Nunes',
    playerName: 'Carla',
    tableId: table.id,
    concept: 'Repórter investigativa de Arkham',
    occupation: 'Jornalista',
    age: 29,
    characteristics: { FOR: 40, CON: 50, TAM: 50, DES: 65, APA: 70, INT: 75, POD: 60, EDU: 70 },
    derived: { PV: 10, PM: 12, SAN: 60, Sorte: 65, Movimento: 8, Corpo: '0', BonusDeDano: 'Nenhum' },
    skills: [
      { name: 'Lábia', value: 60 },
      { name: 'Achados', value: 55 },
      { name: 'Fotografia', value: 50 },
    ],
    backstory: 'Cobre casos que o jornal prefere engavetar.',
    equipment: 'Câmera, caderneta.',
    hook: 'Investiga a Ótica Ferran depois do arrombamento.',
    links: [
      { targetType: 'npc', targetId: npcCloe.id, note: 'Entrevistou Cloé após o arrombamento da ótica.' },
      { targetType: 'location', targetId: locOtica.id, note: 'Acha que o arrombamento foi encomendado.' },
    ],
    status: 'ativo',
    masterNotes: 'Ponte natural entre Arkham e Innsmouth.',
  };

  // --- Session Zero (one for the table) ---
  const sessionZero: SessionZeroEntity = {
    ...base(),
    tableId: table.id,
    agenda: [
      { title: 'Abertura e expectativas', estimatedMinutes: 10, notes: 'Combinar o que todos querem da campanha.', done: true },
      { title: 'Tom e segurança', estimatedMinutes: 15, notes: 'Linhas, véus e X-card.', done: true },
      { title: 'Época e ambientação', estimatedMinutes: 10, notes: 'Nova Inglaterra, 1925.', done: false },
      { title: 'As duas cidades', estimatedMinutes: 10, notes: 'Arkham (razão) x Innsmouth (maré).', done: false },
      { title: 'Como funciona o sandbox', estimatedMinutes: 15, notes: 'Várias tramas, liberdade, consequências.', done: false },
      { title: 'Regras da casa', estimatedMinutes: 10, notes: 'Push, Sorte, ferimentos.', done: false },
      { title: 'Criação de investigadores', estimatedMinutes: 40, notes: 'Com o assistente de CoC 7e.', done: false },
      { title: 'Ganchos e vínculos', estimatedMinutes: 15, notes: 'Cada PJ ligado ao mundo.', done: false },
    ],
    tone: {
      lines: 'Sem violência explícita contra crianças.',
      veils: 'Horror corporal "fecha a câmera".',
      xCard: true,
      horrorLevel: 'Horror cósmico com tensão lenta; pouca ação direta.',
      notes: 'Reforçar que fugir é vitória.',
    },
    houseRules: [
      { text: 'Pontos de Sorte podem ser gastos para evitar a morte uma vez por cenário.', active: true },
      { text: 'Perseguições usam a regra simplificada do Keeper\'s Companion.', active: false },
    ],
    loreCards: [
      {
        title: 'A Nova Inglaterra de 1925',
        scope: 'epoca',
        readAloud: '> Rádios crepitam notícias de um mundo que se moderniza rápido demais para o gosto das cidades antigas.',
        masterNotes: ':::segredo A modernidade é fachada: as cidades velhas guardam pactos mais velhos ainda. :::',
      },
      {
        title: 'Innsmouth, a vila que o mapa evita',
        scope: 'cidade',
        readAloud: '> Dizem que o ônibus para Innsmouth sempre parte meio vazio — e volta mais vazio ainda.',
        masterNotes: ':::segredo A Irmandade controla quem entra e quem sai. :::',
      },
      {
        title: 'Arkham e sua universidade',
        scope: 'cidade',
        readAloud: '> Arkham se orgulha de sua biblioteca e de seus eruditos; nem todo conhecimento ali é inofensivo.',
        masterNotes: '',
      },
    ],
    rumors: [
      { text: 'Pescadores somem sempre perto do equinócio.', plotId: plotMare.id, clueId: clueLista.id, toldToTableIds: [table.id] },
      { text: 'A ótica de Arkham vende lentes que "mostram fantasmas".', plotId: plotLentes.id, clueId: clueLente.id, toldToTableIds: [] },
      { text: 'Um sino toca sob a água antes das tempestades.', plotId: plotSino.id, toldToTableIds: [] },
      { text: 'O relógio da Taverna Maré Mansa parou na mesma hora de um naufrágio antigo.', toldToTableIds: [] },
    ],
  };

  // --- Events (journal) ---
  const ev1: EventEntity = {
    ...base(),
    inGameDate: '14 de setembro de 1925',
    tableId: table.id,
    type: 'nota',
    text: 'O grupo desembarcou em Innsmouth e foi recebido com olhares frios na Taverna Maré Mansa.',
    linkedEntityIds: [locTaverna.id, table.id],
    effectsApplied: [],
  };
  const ev2: EventEntity = {
    ...base(),
    inGameDate: '14 de setembro de 1925',
    tableId: table.id,
    type: 'descoberta',
    text: 'Marina notou que o relógio da taverna estava parado às 3h07.',
    linkedEntityIds: [locTaverna.id, inv3.id],
    effectsApplied: [],
  };
  session.eventIds = [ev1.id, ev2.id];

  // --- Persist everything in one transaction ---
  await db.transaction(
    'rw',
    [
      db.maps,
      db.locations,
      db.npcs,
      db.factions,
      db.plots,
      db.locationPlotLayers,
      db.sceneCards,
      db.clues,
      db.handouts,
      db.gameTables,
      db.sessions,
      db.investigators,
      db.sessionZeros,
      db.events,
      db.meta,
    ],
    async () => {
      await db.maps.bulkPut([innsmouth, arkham]);
      await db.locations.bulkPut([
        locArmazem,
        locCais,
        locTaverna,
        locCapela,
        locMercado,
        locCapitania,
        distPorto,
        distColina,
        locOtica,
        locBiblioteca,
        locPraca,
        locDelegacia,
      ]);
      await db.npcs.bulkPut([npcTeobaldo, npcCloe]);
      await db.factions.bulkPut([facIrmandade, facSociedade]);
      await db.plots.bulkPut([plotMare, plotLentes, plotSino]);
      await db.locationPlotLayers.bulkPut([layerArmazemMare, layerArmazemSino]);
      await db.sceneCards.bulkPut([sceneReuniao, sceneLista]);
      await db.clues.bulkPut([clueMarcas, clueLista, clueLente]);
      await db.handouts.bulkPut([handoutLista]);
      await db.gameTables.bulkPut([table]);
      await db.sessions.bulkPut([session]);
      await db.investigators.bulkPut([inv1, inv2, inv3]);
      await db.sessionZeros.bulkPut([sessionZero]);
      await db.events.bulkPut([ev1, ev2]);
      await db.meta.put({ key: SEED_META_KEY, value: { installedAt: now(), schemaVersion: SCHEMA_VERSION } });
    },
  );
}

/** Whether the demo seed is currently installed. */
export async function isSeedInstalled(): Promise<boolean> {
  const rec = await db.meta.get(SEED_META_KEY);
  return Boolean(rec);
}

/** Wipe everything ("Começar do zero"). */
export async function wipeAll(): Promise<void> {
  await Promise.all([
    db.maps.clear(),
    db.locations.clear(),
    db.npcs.clear(),
    db.factions.clear(),
    db.plots.clear(),
    db.locationPlotLayers.clear(),
    db.sceneCards.clear(),
    db.clues.clear(),
    db.handouts.clear(),
    db.gameTables.clear(),
    db.sessions.clear(),
    db.investigators.clear(),
    db.sessionZeros.clear(),
    db.events.clear(),
    db.importBatches.clear(),
    db.blobs.clear(),
    db.meta.clear(),
  ]);
}

/** Install the seed only if the database is empty and the seed was never set. */
export async function ensureSeed(): Promise<void> {
  const installed = await isSeedInstalled();
  const anyMaps = await db.maps.count();
  if (!installed && anyMaps === 0) {
    await installSeed();
  }
}
