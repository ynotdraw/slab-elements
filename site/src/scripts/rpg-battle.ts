// The Retro RPG showcase's battle: a turn-based fight across four waves,
// played entirely through Slab's headless elements. A Menu, with Skill and
// Item submenus, is each party member's command window. A Listbox picks the
// target. Progress bars are the party's HP and MP, and a Meter each foe's HP.
// Steps tracks the waves, a Hover Card tells a foe's weaknesses, a Toast says
// what was found, and an Alert Dialog ends the fight. The pause menu is a
// Dialog of Tabs whose Selects, Slider, Radio Group, Switch and Checkbox all
// change the battle.
//
// Everything that happens goes into a `[role=log]`, so the whole fight can be
// followed by ear and played with a keyboard alone.

// Each foe is drawn with a Hover Card and a Meter, which aren't on the page
// until the first wave is, so they're made from their classes here rather
// than found there.
import HoverCard from '../../../src/hover-card.ts';
import Meter from '../../../src/meter.ts';

type Element_ = 'bolt' | 'fire' | 'ice';
type Side = 'foe' | 'party';

type Combatant = {
  atk: number;
  def: number;
  defending: boolean;
  element: HTMLElement;
  hp: number;
  id: string;
  kind: string;
  mag: number;
  maxHp: number;
  maxMp: number;
  mp: number;
  name: string;
  resist: Element_[];
  side: Side;
  spd: number;
  weak: Element_[];
};

type Target = 'all-allies' | 'all-foes' | 'ally' | 'fallen' | 'foe' | 'self';

type Action = {
  cost?: number;
  element?: Element_;
  id: string;
  kind: 'defend' | 'heal' | 'item' | 'magic' | 'physical' | 'revive';
  name: string;
  power: number;
  target: Target;
};

type FoeAction = Omit<Action, 'target'> & { target: 'all' | 'one' };

type FoeKind = {
  actions: FoeAction[];
  atk: number;
  def: number;
  flavor: string;
  hp: number;
  mag: number;
  name: string;
  resist: Element_[];
  spd: number;
  weak: Element_[];
};

const elementNames: Record<Element_, string> = {
  bolt: 'Lightning',
  fire: 'Fire',
  ice: 'Ice',
};

const actions: Record<string, Action> = {
  attack: {
    id: 'attack',
    kind: 'physical',
    name: 'Attack',
    power: 1,
    target: 'foe',
  },
  defend: {
    id: 'defend',
    kind: 'defend',
    name: 'Defend',
    power: 0,
    target: 'self',
  },
  'heavy-swing': {
    cost: 8,
    id: 'heavy-swing',
    kind: 'physical',
    name: 'Heavy Swing',
    power: 1.7,
    target: 'foe',
  },
  cleave: {
    cost: 16,
    id: 'cleave',
    kind: 'physical',
    name: 'Cleave',
    power: 0.75,
    target: 'all-foes',
  },
  mend: {
    cost: 20,
    id: 'mend',
    kind: 'heal',
    name: 'Mend',
    power: 12,
    target: 'ally',
  },
  'mend-all': {
    cost: 45,
    id: 'mend-all',
    kind: 'heal',
    name: 'Mend All',
    power: 7,
    target: 'all-allies',
  },
  revive: {
    cost: 40,
    id: 'revive',
    kind: 'revive',
    name: 'Revive',
    power: 0.25,
    target: 'fallen',
  },
  cinder: {
    cost: 18,
    element: 'fire',
    id: 'cinder',
    kind: 'magic',
    name: 'Cinder',
    power: 1,
    target: 'foe',
  },
  rime: {
    cost: 18,
    element: 'ice',
    id: 'rime',
    kind: 'magic',
    name: 'Rime',
    power: 1,
    target: 'foe',
  },
  spark: {
    cost: 18,
    element: 'bolt',
    id: 'spark',
    kind: 'magic',
    name: 'Spark',
    power: 1,
    target: 'foe',
  },
  starfall: {
    cost: 64,
    id: 'starfall',
    kind: 'magic',
    name: 'Starfall',
    power: 0.85,
    target: 'all-foes',
  },
  tonic: {
    id: 'tonic',
    kind: 'item',
    name: 'Tonic',
    power: 500,
    target: 'ally',
  },
  'hi-tonic': {
    id: 'hi-tonic',
    kind: 'item',
    name: 'Hi-Tonic',
    power: 1500,
    target: 'ally',
  },
  ether: {
    id: 'ether',
    kind: 'item',
    name: 'Ether Drop',
    power: 100,
    target: 'ally',
  },
  feather: {
    id: 'feather',
    kind: 'item',
    name: 'Phoenix Quill',
    power: 0.5,
    target: 'fallen',
  },
};

const foeKinds: Record<string, FoeKind> = {
  lantern: {
    actions: [
      {
        element: 'fire',
        id: 'flame',
        kind: 'magic',
        name: 'Will-o’-flame',
        power: 1,
        target: 'one',
      },
      {
        id: 'flicker',
        kind: 'physical',
        name: 'Flicker',
        power: 0.9,
        target: 'one',
      },
    ],
    atk: 44,
    def: 18,
    flavor: 'A marsh light that leads travelers astray, then burns them.',
    hp: 640,
    mag: 48,
    name: 'Bog Lantern',
    resist: ['fire'],
    spd: 13,
    weak: ['ice'],
  },
  reedmaw: {
    actions: [
      { id: 'bite', kind: 'physical', name: 'Bite', power: 1.1, target: 'one' },
      {
        id: 'thrash',
        kind: 'physical',
        name: 'Thrash',
        power: 0.6,
        target: 'all',
      },
    ],
    atk: 78,
    def: 30,
    flavor: 'A mouth of reeds and silt that waits under the water’s edge.',
    hp: 1500,
    mag: 10,
    name: 'Reedmaw',
    resist: [],
    spd: 9,
    weak: ['fire'],
  },
  crab: {
    actions: [
      {
        id: 'pinch',
        kind: 'physical',
        name: 'Pinch',
        power: 1.1,
        target: 'one',
      },
      {
        id: 'shell',
        kind: 'defend',
        name: 'Shell Up',
        power: 0,
        target: 'one',
      },
    ],
    atk: 70,
    def: 75,
    flavor: 'Its shell turns a blade. Current runs right through it, though.',
    hp: 1100,
    mag: 10,
    name: 'Brine Crab',
    resist: ['ice'],
    spd: 8,
    weak: ['bolt'],
  },
  tidewarden: {
    actions: [
      {
        id: 'crush',
        kind: 'physical',
        name: 'Crushing Tide',
        power: 1.5,
        target: 'one',
      },
      {
        id: 'undertow',
        kind: 'magic',
        name: 'Undertow',
        power: 0.75,
        target: 'all',
      },
      { id: 'slam', kind: 'physical', name: 'Slam', power: 1, target: 'one' },
    ],
    atk: 90,
    def: 40,
    flavor: 'The crossing’s old keeper. Past half its strength, it acts twice.',
    hp: 9000,
    mag: 80,
    name: 'The Tidewarden',
    resist: ['ice'],
    spd: 11,
    weak: ['bolt'],
  },
};

const waves: { drop?: [string, number]; foes: string[] }[] = [
  { drop: ['tonic', 2], foes: ['lantern', 'lantern'] },
  { drop: ['ether', 1], foes: ['reedmaw', 'lantern'] },
  { drop: ['hi-tonic', 1], foes: ['crab', 'crab'] },
  { foes: ['tidewarden'] },
];

const startingItems: Record<string, number> = {
  ether: 6,
  feather: 2,
  'hi-tonic': 4,
  tonic: 12,
};

const partyStats: Record<
  string,
  { atk: number; def: number; mag: number; spd: number }
> = {
  rook: { atk: 40, def: 0, mag: 12, spd: 12 },
  seri: { atk: 30, def: 22, mag: 50, spd: 14 },
  tamsin: { atk: 22, def: 16, mag: 64, spd: 16 },
};

// Original art: each foe is a few shapes, drawn in the page's palette.
const art: Record<string, string> = {
  lantern: `<svg viewBox="0 0 64 64" aria-hidden="true"><defs><radialGradient id="rpg-glow"><stop offset="0" stop-color="#fff7c2"/><stop offset=".55" stop-color="#ffb84d"/><stop offset="1" stop-color="#ff6a3d" stop-opacity="0"/></radialGradient></defs><circle cx="32" cy="34" r="26" fill="url(#rpg-glow)"/><path d="M32 8c10 12 16 20 16 29a16 16 0 0 1-32 0c0-9 6-17 16-29z" fill="#ffd76a" stroke="#7a3b12" stroke-width="2"/><circle cx="26" cy="38" r="3" fill="#2a1406"/><circle cx="38" cy="38" r="3" fill="#2a1406"/><path d="M27 46q5 3 10 0" stroke="#2a1406" stroke-width="2" fill="none"/></svg>`,
  reedmaw: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 52c0-18 10-34 24-34s24 16 24 34z" fill="#4c8a3f" stroke="#14300f" stroke-width="2"/><path d="M14 22l-3-14 7 12M24 18l-1-14 5 13M40 18l1-14 4 14M50 22l4-13-1 15" stroke="#7fbf5a" stroke-width="3" fill="none"/><path d="M16 40h32l-4 10H20z" fill="#2a0c0c"/><path d="M18 40l3 5 3-5 3 5 3-5 3 5 3-5 3 5 3-5 3 5 2-5" fill="#fff" stroke="#fff"/><circle cx="24" cy="31" r="3" fill="#ffe36a"/><circle cx="40" cy="31" r="3" fill="#ffe36a"/></svg>`,
  crab: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M6 24a8 8 0 0 1 12-6l-4 6 6 2a8 8 0 0 1-14-2zM58 24a8 8 0 0 0-12-6l4 6-6 2a8 8 0 0 0 14-2z" fill="#e0603e" stroke="#4a1208" stroke-width="2"/><path d="M14 28l8 8M50 28l-8 8" stroke="#4a1208" stroke-width="3"/><ellipse cx="32" cy="42" rx="20" ry="13" fill="#d4512f" stroke="#4a1208" stroke-width="2"/><path d="M16 50l-6 6M22 54l-4 6M48 50l6 6M42 54l4 6" stroke="#4a1208" stroke-width="3"/><circle cx="26" cy="30" r="3" fill="#111" stroke="#fff"/><circle cx="38" cy="30" r="3" fill="#111" stroke="#fff"/></svg>`,
  tidewarden: `<svg viewBox="0 0 96 96" aria-hidden="true"><path d="M8 88c4-30 18-58 40-62 22 4 36 32 40 62z" fill="#1f6f8b" stroke="#06222c" stroke-width="3"/><path d="M8 88c10-8 20-8 30 0 10-8 20-8 30 0 10-8 16-8 20 0" fill="none" stroke="#bff3ff" stroke-width="3"/><path d="M30 26l6-16 6 12 6-16 6 16 6-12 6 16z" fill="#ffd76a" stroke="#6b4a06" stroke-width="2"/><circle cx="38" cy="46" r="5" fill="#bff3ff"/><circle cx="58" cy="46" r="5" fill="#bff3ff"/><circle cx="38" cy="46" r="2" fill="#06222c"/><circle cx="58" cy="46" r="2" fill="#06222c"/><path d="M34 62q14 8 28 0" stroke="#06222c" stroke-width="3" fill="none"/></svg>`,
};

class Stopped extends Error {}

const random = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]!;

type Tagged = HTMLElement & Record<string, any>;

let run = 0;

document.addEventListener('astro:before-swap', () => {
  run += 1;
});

// Starts the battle on a page that has one, once. The module can load after
// the first "astro:page-load", so it also looks as soon as it runs.
const started = new WeakSet<HTMLElement>();

const startOnPage = () => {
  const root = document.querySelector<HTMLElement>('[data-rpg]');

  if (root && !started.has(root)) {
    started.add(root);
    void start(root);
  }
};

document.addEventListener('astro:page-load', startOnPage);
startOnPage();

async function start(root: HTMLElement) {
  await Promise.all(
    [
      'slab-alert-dialog',
      'slab-dialog',
      'slab-hover-card',
      'slab-listbox',
      'slab-menu',
      'slab-meter',
      'slab-progress',
      'slab-steps',
      'slab-toast',
    ].map((tag) => customElements.whenDefined(tag)),
  );

  const $ = <T extends Element = Tagged>(selector: string) =>
    root.querySelector(selector) as T;

  const foesList = $('[data-rpg-foes]');
  const order = $('[data-rpg-order]');
  const turn = $('[data-rpg-turn]');
  const targets = $('[data-rpg-targets]');
  const log = $('[data-rpg-log]');
  const waveSteps = $('[data-rpg-waves], .rpg-waves');
  const pauseMenu = $('[data-rpg-menu]');
  const result = $('[data-rpg-result]');
  const resultText = $('[data-rpg-result-text]');
  const restart = $<HTMLButtonElement>('[data-rpg-restart]');
  const toast = $('[data-rpg-toast]');
  const coinText = $('[data-rpg-coin]');
  const gearText = $('[data-rpg-gear]');
  const bag = $('[data-rpg-bag]');
  const about = $('[data-rpg-about]');
  const menus = new Map(
    [...root.querySelectorAll<Tagged>('[data-rpg-commands]')].map((menu) => [
      menu.dataset.rpgCommands!,
      menu,
    ]),
  );

  let game = 0;
  let paused = false;
  let coin = 18_240;
  let items = { ...startingItems };
  let party: Combatant[] = [];
  let foes: Combatant[] = [];
  let wave = 0;

  // The choice the battle is waiting for, while it's the party's turn.
  let choosing:
    | {
        action?: Action;
        actor: Combatant;
        resolve: (choice: { action: Action; targets: Combatant[] }) => void;
      }
    | undefined;

  const gear = { armor: 31, charm: '', weapon: 48 };

  const config = () => ({
    delay: 1500 - Number(($('[data-rpg-speed]') as Tagged).value ?? 4) * 200,
    easy: Boolean(($('[data-rpg-easy]') as Tagged).checked),
    numbers: ($('[data-rpg-numbers]') as Tagged).checked !== false,
  });

  const reducedMotion = () =>
    matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Waits, and keeps waiting while the game is paused. A new game, or leaving
  // the page, stops whatever was waiting.
  const wait = async (ms: number) => {
    const mine = game;
    const current = run;

    await new Promise((resolve) => setTimeout(resolve, ms));

    while (paused && mine === game && current === run) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (mine !== game || current !== run) {
      throw new Stopped();
    }
  };

  const say = (text: string) => {
    const line = document.createElement('li');

    line.textContent = text;
    log.append(line);

    while (log.children.length > 40) {
      log.firstElementChild?.remove();
    }

    log.parentElement!.scrollTop = log.parentElement!.scrollHeight;
  };

  const notify = (text: string) => {
    toast.textContent = text;
    void toast.show();
  };

  const alive = (list: Combatant[]) => list.filter((member) => member.hp > 0);

  const pop = (target: Combatant, text: string, type = 'damage') => {
    if (config().numbers) {
      const number = document.createElement('span');

      number.ariaHidden = 'true';
      number.className = `rpg-pop rpg-pop--${type}`;
      number.textContent = text;
      target.element.append(number);
      setTimeout(() => number.remove(), reducedMotion() ? 900 : 1100);
    }
  };

  const flash = (element: Element, name: string) => {
    element.classList.remove(name);
    void (element as HTMLElement).offsetWidth;
    element.classList.add(name);
    setTimeout(() => element.classList.remove(name), 500);
  };

  // Party ---------------------------------------------------------------

  const buildParty = () =>
    [...root.querySelectorAll<HTMLElement>('[data-rpg-member]')].map(
      (element) => {
        const id = element.dataset.rpgMember!;
        const hp = element.querySelector<Tagged>('[data-rpg-hp]')!;
        const mp = element.querySelector<Tagged>('[data-rpg-mp]')!;
        const stats = partyStats[id]!;

        return {
          atk: stats.atk,
          def: stats.def,
          defending: false,
          element,
          hp: Number(hp.max),
          id,
          kind: id,
          mag: stats.mag,
          maxHp: Number(hp.max),
          maxMp: Number(mp.max),
          mp: Number(mp.max),
          name: element
            .querySelector('.rpg-name')!
            .firstChild!.textContent!.trim(),
          resist: [],
          side: 'party' as const,
          spd: stats.spd,
          weak: [],
        };
      },
    );

  const attackOf = (combatant: Combatant) =>
    combatant.id === 'rook' ? combatant.atk + gear.weapon : combatant.atk;

  const defenseOf = (combatant: Combatant) =>
    combatant.id === 'rook' ? gear.armor : combatant.def;

  const render = (combatant: Combatant) => {
    if (combatant.side === 'party') {
      const hp = combatant.element.querySelector<Tagged>('[data-rpg-hp]')!;
      const mp = combatant.element.querySelector<Tagged>('[data-rpg-mp]')!;

      hp.value = combatant.hp;
      hp.label = `HP ${combatant.hp} / ${combatant.maxHp}`;
      hp.classList.toggle('rpg-low', combatant.hp / combatant.maxHp < 0.35);
      mp.value = combatant.mp;
      mp.label = `MP ${combatant.mp} / ${combatant.maxMp}`;
    } else {
      const meter = combatant.element.querySelector<Tagged>('slab-meter')!;

      meter.value = combatant.hp;
    }

    combatant.element.toggleAttribute('data-ko', combatant.hp <= 0);
  };

  const renderGear = () => {
    const rook = party.find((member) => member.id === 'rook');

    gearText.textContent = `ATK ${rook ? attackOf(rook) : 40 + gear.weapon} · DEF ${gear.armor}`;
  };

  const renderItems = () => {
    for (const [id, count] of Object.entries(items)) {
      for (const element of root.querySelectorAll(
        `[data-rpg-item="${id}"] [data-rpg-count]`,
      )) {
        element.textContent = String(count);
      }

      const bagCount = root.querySelector(`[data-rpg-count="${id}"]`);

      if (bagCount) {
        bagCount.textContent = `×${count}`;
      }
    }
  };

  // Foes ----------------------------------------------------------------

  const buildWave = (index: number) => {
    foesList.replaceChildren();

    const counts = new Map<string, number>();
    const totals = new Map<string, number>();

    for (const kind of waves[index]!.foes) {
      totals.set(kind, (totals.get(kind) ?? 0) + 1);
    }

    return waves[index]!.foes.map((kind, position) => {
      const type = foeKinds[kind]!;
      const count = (counts.get(kind) ?? 0) + 1;

      counts.set(kind, count);

      const name =
        totals.get(kind)! > 1
          ? `${type.name} ${String.fromCodePoint(64 + count)}`
          : type.name;

      const item = document.createElement('li');

      item.className = 'rpg-foe';
      item.dataset.kind = kind;

      const card = new HoverCard() as unknown as Tagged;

      card.setAttribute('label', `About ${name}`);
      card.setAttribute('placement', 'bottom');

      const sprite = document.createElement('button');

      sprite.className = 'rpg-sprite';
      sprite.slot = 'anchor';
      sprite.type = 'button';
      sprite.ariaLabel = name;
      sprite.dataset.rpgFoe = String(position);
      sprite.innerHTML = art[kind]!;

      const weakness = [
        type.weak.length > 0
          ? `Weak to ${type.weak.map((element) => elementNames[element]).join(', ')}`
          : '',
        type.resist.length > 0
          ? `Resists ${type.resist.map((element) => elementNames[element]).join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join(' · ');

      const content = document.createElement('div');

      content.className = 'rpg-card';
      content.innerHTML = `<p class="rpg-card-name"></p><p class="rpg-card-weak"></p><p class="rpg-card-flavor"></p>`;
      content.children[0]!.textContent = type.name;
      content.children[1]!.textContent = weakness || 'No weakness known';
      content.children[2]!.textContent = type.flavor;

      card.append(sprite, content);

      const label = document.createElement('p');

      label.className = 'rpg-foe-name';
      label.textContent = name;
      label.ariaHidden = 'true';

      const meter = new Meter() as unknown as Tagged;

      meter.setAttribute('label', `${name} HP`);
      meter.setAttribute('hide-label', '');
      meter.setAttribute('min', '0');
      meter.setAttribute('max', String(type.hp));
      meter.setAttribute('low', String(Math.round(type.hp * 0.25)));
      meter.setAttribute('high', String(Math.round(type.hp * 0.5)));
      meter.setAttribute('optimum', String(type.hp));
      meter.setAttribute('value', String(type.hp));
      meter.formatValue = (value: number) => `${value} of ${type.hp} HP`;

      item.append(card, label, meter);
      foesList.append(item);

      return {
        atk: type.atk,
        def: type.def,
        defending: false,
        element: item,
        hp: type.hp,
        id: `${kind}-${position}`,
        kind,
        mag: type.mag,
        maxHp: type.hp,
        maxMp: 0,
        mp: 0,
        name,
        resist: type.resist,
        side: 'foe' as const,
        spd: type.spd,
        weak: type.weak,
      };
    });
  };

  // Combat --------------------------------------------------------------

  const hit = (
    attacker: Combatant,
    target: Combatant,
    action: Action | FoeAction,
  ) => {
    const crit =
      action.kind === 'physical' &&
      Math.random() <
        (attacker.id === 'rook' && gear.charm === 'lucky' ? 0.2 : 0.08);

    let amount =
      action.kind === 'physical'
        ? (attackOf(attacker) * 5 * action.power * 100) /
          (100 + defenseOf(target) * 2)
        : attacker.mag * 5 * action.power;

    let note = '';

    if (action.element && target.weak.includes(action.element)) {
      amount *= 2;
      note = ` It’s weak to ${elementNames[action.element].toLowerCase()}!`;
    } else if (action.element && target.resist.includes(action.element)) {
      amount *= 0.5;
      note = ' It resists.';
    }

    if (
      action.element === 'fire' &&
      target.id === 'rook' &&
      gear.charm === 'ember'
    ) {
      amount *= 0.5;
    }

    if (crit) {
      amount *= 1.5;
      note += ' Critical!';
    }

    if (target.defending) {
      amount *= 0.5;
    }

    if (target.side === 'party' && config().easy) {
      amount *= 0.6;
    }

    const damage = Math.max(1, Math.round(amount * random(0.9, 1.1)));

    target.hp = Math.max(0, target.hp - damage);
    render(target);
    flash(target.element, 'rpg-hit');
    pop(target, String(damage), crit ? 'crit' : 'damage');

    return { damage, note };
  };

  const fallen = (target: Combatant) =>
    target.side === 'foe'
      ? ` ${target.name} is defeated.`
      : ` ${target.name} falls!`;

  const perform = (
    actor: Combatant,
    action: Action | FoeAction,
    chosen: Combatant[],
  ) => {
    actor.defending = false;

    if (action.cost) {
      actor.mp -= action.cost;
      render(actor);
    }

    if (action.kind === 'defend') {
      actor.defending = true;
      say(
        actor.side === 'foe'
          ? `${actor.name} uses ${action.name} and braces itself.`
          : `${actor.name} defends.`,
      );

      return;
    }

    if (action.kind === 'item') {
      items[action.id] -= 1;
      renderItems();
    }

    if (
      action.kind === 'heal' ||
      (action.kind === 'item' &&
        action.id !== 'ether' &&
        action.id !== 'feather')
    ) {
      const lines = chosen.map((target) => {
        const amount =
          action.kind === 'heal'
            ? Math.round(actor.mag * action.power * random(0.95, 1.05))
            : action.power;
        const healed = Math.min(amount, target.maxHp - target.hp);

        target.hp += healed;
        render(target);
        pop(target, `+${healed}`, 'heal');

        return healed > 0
          ? `${target.name} recovers ${healed} HP.`
          : `${target.name} is already at full HP.`;
      });

      say(`${actor.name} uses ${action.name}. ${lines.join(' ')}`);

      return;
    }

    if (action.id === 'ether') {
      const [target] = chosen as [Combatant];
      const restored = Math.min(action.power, target.maxMp - target.mp);

      target.mp += restored;
      render(target);
      pop(target, `+${restored} MP`, 'mp');
      say(
        `${actor.name} uses ${action.name}. ${target.name} recovers ${restored} MP.`,
      );

      return;
    }

    if (action.kind === 'revive' || action.id === 'feather') {
      const [target] = chosen as [Combatant];

      target.hp = Math.round(target.maxHp * action.power);
      target.defending = false;
      render(target);
      pop(target, `+${target.hp}`, 'heal');
      say(
        `${actor.name} uses ${action.name}. ${target.name} is back on their feet with ${target.hp} HP.`,
      );

      return;
    }

    const lines = chosen.map((target) => {
      const { damage, note } = hit(actor, target, action);

      return `${chosen.length > 1 ? `${target.name} takes ${damage}.` : `${damage} damage.`}${note}${target.hp <= 0 ? fallen(target) : ''}`;
    });

    const verb =
      action.id === 'attack'
        ? `${actor.name} attacks${chosen.length === 1 ? ` ${chosen[0]!.name}` : ''}.`
        : `${actor.name} uses ${action.name}${chosen.length === 1 ? ` on ${chosen[0]!.name}` : ''}.`;

    say(`${verb} ${lines.join(' ')}`);
  };

  // The party's turn ----------------------------------------------------

  const candidates = (actor: Combatant, target: Target) => {
    switch (target) {
      case 'ally': {
        return alive(party);
      }
      case 'fallen': {
        return party.filter((member) => member.hp <= 0);
      }
      case 'foe': {
        return alive(foes);
      }
      case 'all-allies': {
        return alive(party);
      }
      case 'all-foes': {
        return alive(foes);
      }
      case 'self': {
        return [actor];
      }
    }
  };

  const updateCommands = (actor: Combatant) => {
    const menu = menus.get(actor.id)!;

    for (const item of menu.querySelectorAll<Tagged>('[data-rpg-action]')) {
      const action = actions[item.dataset.rpgAction!]!;
      const short =
        (action.cost !== undefined && actor.mp < action.cost) ||
        (action.kind === 'item' && items[action.id]! <= 0) ||
        candidates(actor, action.target).length === 0;

      item.disabled = short;
    }
  };

  const showOrder = (queue: Combatant[], current?: Combatant) => {
    order.replaceChildren(
      ...[current, ...queue]
        .filter((member): member is Combatant =>
          Boolean(member && member.hp > 0),
        )
        .map((member, index) => {
          const item = document.createElement('li');

          item.textContent = member.name;
          item.dataset.side = member.side;

          if (index === 0) {
            item.ariaCurrent = 'true';
          }

          return item;
        }),
    );
  };

  // The last command window stays where it is, its button disabled, so focus
  // has somewhere to rest until the next member's turn.
  const stopChoosing = () => {
    for (const menu of menus.values()) {
      menu.querySelector('[slot="anchor"]')!.ariaDisabled = 'true';
      menu.hide?.();
    }

    targets.hidden = true;
    choosing = undefined;
  };

  const openCommands = () => {
    if (!choosing) {
      return;
    }

    const menu = menus.get(choosing.actor.id)!;

    targets.hidden = true;
    choosing.action = undefined;

    for (const other of menus.values()) {
      other.hidden = other !== menu;
    }

    menu.querySelector('[slot="anchor"]')!.ariaDisabled = 'false';
    requestAnimationFrame(() => menu.show());
  };

  const choose = (actor: Combatant) =>
    new Promise<{ action: Action; targets: Combatant[] }>((resolve) => {
      choosing = { actor, resolve };
      updateCommands(actor);
      turn.textContent = `${actor.name}’s turn. Choose a command.`;

      for (const member of party) {
        member.element.toggleAttribute('data-active', member === actor);
      }

      openCommands();
    });

  const decide = (action: Action) => {
    if (!choosing) {
      return;
    }

    const { actor } = choosing;
    const list = candidates(actor, action.target);

    if (
      action.target === 'all-allies' ||
      action.target === 'all-foes' ||
      action.target === 'self'
    ) {
      confirm(action, list);

      return;
    }

    choosing.action = action;

    const options = list.map((target) => {
      const option = document.createElement('slab-option') as Tagged;

      option.value = target.id;
      option.setAttribute('value', target.id);
      option.textContent =
        target.side === 'party'
          ? `${target.name} · HP ${target.hp}/${target.maxHp}`
          : target.name;

      return option;
    });

    targets.replaceChildren(
      targets.querySelector('[slot="description"]')!,
      ...options,
    );
    targets.label = `${action.name}: choose a target`;
    targets.hidden = false;
    turn.textContent = `${actor.name} · ${action.name}. Choose a target.`;

    requestAnimationFrame(() => {
      targets.focus();
      targets.activeOption = options[0];
    });
  };

  const confirm = (action: Action, chosen: Combatant[]) => {
    const current = choosing;

    if (!current) {
      return;
    }

    // Focus is on a target, which is about to be hidden, so it goes back to
    // the command window's button.
    const refocus = targets.matches(':focus-within');

    stopChoosing();
    turn.textContent = `${current.actor.name} · ${action.name}`;

    if (refocus) {
      menus
        .get(current.actor.id)!
        .querySelector<HTMLElement>('[slot="anchor"]')!
        .focus();
    }

    current.resolve({ action, targets: chosen });
  };

  const confirmTarget = (id: string | undefined) => {
    const action = choosing?.action;
    const target = [...party, ...foes].find((member) => member.id === id);

    if (
      action &&
      target &&
      candidates(choosing!.actor, action.target).includes(target)
    ) {
      confirm(action, [target]);
    }
  };

  // Foes' turns ---------------------------------------------------------

  const foeTurn = (foe: Combatant) => {
    const type = foeKinds[foe.kind]!;
    const targetsLeft = alive(party);
    let action = pick(type.actions);

    // A Crab doesn't brace twice in a row.
    if (action.kind === 'defend' && foe.defending) {
      action = type.actions[0]!;
    }

    turn.textContent = `${foe.name}’s turn.`;
    flash(foe.element, 'rpg-acting');

    if (action.kind === 'defend') {
      perform(foe, action, [foe]);

      return;
    }

    perform(
      foe,
      action,
      action.target === 'all' ? targetsLeft : [pick(targetsLeft)],
    );
  };

  // The fight -----------------------------------------------------------

  const roundOrder = () => {
    const everyone = [...alive(party), ...alive(foes)].map((member) => ({
      member,
      speed: member.spd * random(0.85, 1.15),
    }));

    // Past half its strength, the Tidewarden acts twice a round.
    for (const foe of alive(foes)) {
      if (foe.kind === 'tidewarden' && foe.hp < foe.maxHp / 2) {
        everyone.push({ member: foe, speed: foe.spd * random(0.3, 0.6) });
      }
    }

    return everyone
      .toSorted((a, b) => b.speed - a.speed)
      .map(({ member }) => member);
  };

  const fight = async () => {
    const mine = game;

    try {
      let enraged = false;

      foes = buildWave(wave);
      say(
        `Wave ${wave + 1}: ${foes.map((foe) => foe.name).join(' and ')} ${foes.length > 1 ? 'appear' : 'appears'}!`,
      );

      while (mine === game) {
        const queue = roundOrder();

        while (queue.length > 0) {
          const actor = queue.shift()!;

          if (actor.hp <= 0) {
            continue;
          }

          showOrder(queue, actor);

          if (actor.side === 'party') {
            actor.defending = false;

            const { action, targets: chosen } = await choose(actor);

            for (const member of party) {
              member.element.removeAttribute('data-active');
            }

            perform(actor, action, chosen);
          } else {
            await wait(config().delay / 2);
            foeTurn(actor);
          }

          await wait(config().delay);

          const boss = foes.find((foe) => foe.kind === 'tidewarden');

          if (boss && boss.hp > 0 && boss.hp < boss.maxHp / 2 && !enraged) {
            enraged = true;
            say('The Tidewarden rises in fury! It will act twice each round.');
            await wait(config().delay);
          }

          if (alive(party).length === 0) {
            end(false);

            return;
          }

          if (alive(foes).length === 0) {
            const earned = foes.reduce(
              (sum, foe) => sum + Math.round(foe.maxHp / 4),
              0,
            );
            const drop = waves[wave]!.drop;

            coin += earned;
            coinText.textContent = `${coin.toLocaleString('en-US')} ¢`;

            if (wave === waves.length - 1) {
              end(true, earned);

              return;
            }

            const found = drop
              ? ` Found ${drop[1]} ${actions[drop[0]]!.name}${drop[1] > 1 ? 's' : ''}.`
              : '';

            if (drop) {
              items[drop[0]] = (items[drop[0]] ?? 0) + drop[1];
              renderItems();
            }

            say(`Wave ${wave + 1} cleared! You earn ${earned} coin.${found}`);
            notify(`Wave ${wave + 1} cleared!${found}`);
            wave += 1;
            waveSteps.step = wave + 1;
            await wait(config().delay * 1.5);
            foes = buildWave(wave);
            say(
              wave === waves.length - 1
                ? 'The water churns. The Tidewarden rises from the marsh!'
                : `Wave ${wave + 1}: ${foes.map((foe) => foe.name).join(' and ')} ${foes.length > 1 ? 'appear' : 'appears'}!`,
            );
            await wait(config().delay);
            break;
          }
        }
      }
    } catch (error) {
      if (!(error instanceof Stopped)) {
        throw error;
      }
    }
  };

  const end = (won: boolean, earned = 0) => {
    stopChoosing();

    for (const menu of menus.values()) {
      menu.hidden = true;
    }

    order.replaceChildren();
    turn.textContent = won ? 'Victory!' : 'The party has fallen.';
    restart.hidden = false;

    if (won) {
      waveSteps.step = waves.length + 1;
    }

    say(
      won
        ? `The Tidewarden sinks beneath the marsh. Victory! You earn ${earned} coin.`
        : 'The party has fallen…',
    );
    result.label = won ? 'Victory!' : 'Defeat';
    resultText.textContent = won
      ? `The Tidewarden sinks beneath the marsh, and Saltmarsh Crossing is safe. You earned ${earned} coin.`
      : 'The party has fallen. The marsh keeps its secrets, for now.';
    result.open = true;
  };

  const newGame = () => {
    game += 1;
    stopChoosing();
    paused = false;
    wave = 0;
    items = { ...startingItems };
    party = buildParty();
    restart.hidden = true;
    log.replaceChildren();
    waveSteps.step = 1;

    for (const member of party) {
      render(member);
      member.element.removeAttribute('data-active');
    }

    renderItems();
    renderGear();
    void fight();
  };

  // Listeners -----------------------------------------------------------

  const signal = (() => {
    const controller = new AbortController();
    const current = run;

    const check = () => {
      if (current !== run) {
        controller.abort();
        game += 1;
      }
    };

    document.addEventListener('astro:before-swap', check, { once: true });

    return controller.signal;
  })();

  root.addEventListener(
    'click',
    (event) => {
      const target = event.target as Element;
      const item = target.closest<HTMLElement>(
        'slab-menu-item[data-rpg-action]',
      );

      if (
        item &&
        choosing &&
        item.closest('[data-rpg-commands]') === menus.get(choosing.actor.id)
      ) {
        decide(actions[item.dataset.rpgAction!]!);

        return;
      }

      const option = target.closest<Tagged>('slab-option');

      if (option && option.closest('[data-rpg-targets]')) {
        confirmTarget(option.value);

        return;
      }

      const sprite = target.closest<HTMLElement>('[data-rpg-foe]');

      if (sprite) {
        if (choosing?.action) {
          confirmTarget(foes[Number(sprite.dataset.rpgFoe)]?.id);
        } else {
          (sprite.parentElement as Tagged).show();
        }

        return;
      }

      if (target.closest('[data-rpg-pause]')) {
        pauseMenu.open = true;

        return;
      }

      if (target.closest('[data-rpg-restart]')) {
        newGame();
      }
    },
    { signal },
  );

  targets.addEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        confirmTarget(targets.activeOption?.value);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        openCommands();
      }
    },
    { signal },
  );

  // A command window opens only for the member whose turn it is.
  for (const menu of menus.values()) {
    menu.addEventListener(
      'beforetoggle',
      (event: ToggleEvent) => {
        if (
          event.newState === 'open' &&
          menu.dataset.rpgCommands !== choosing?.actor.id
        ) {
          event.preventDefault();
        }
      },
      { signal },
    );
  }

  pauseMenu.addEventListener(
    'toggle',
    (event: ToggleEvent) => {
      paused = event.newState === 'open';

      if (!paused && choosing && !choosing.action) {
        openCommands();
      }
    },
    { signal },
  );

  result.addEventListener(
    'close',
    () => {
      if (result.returnValue === 'again') {
        newGame();
      } else {
        restart.focus();
      }
    },
    { signal },
  );

  bag.addEventListener(
    'change',
    () => {
      about.textContent = bag.selectedOptions[0]?.dataset.about ?? '';
    },
    { signal },
  );

  for (const select of root.querySelectorAll<Tagged>('[data-rpg-equip]')) {
    select.addEventListener(
      'change',
      () => {
        const slot = select.dataset.rpgEquip as keyof typeof gear;

        if (slot === 'charm') {
          gear.charm = select.value;
        } else {
          gear[slot] = Number(select.value);
        }

        renderGear();
      },
      { signal },
    );
  }

  $('[data-rpg-color]').addEventListener(
    'change',
    (event: Event) => {
      root.dataset.color = (event.currentTarget as Tagged).value;
    },
    { signal },
  );

  newGame();
}
