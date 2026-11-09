// The Retro RPG showcase's art: original creatures and portraits, each a small
// inline SVG. They're decoration, hidden from screenreaders, which get each
// one's name from the element around it.

const svg = (viewBox: string, body: string) =>
  `<svg aria-hidden="true" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const foeArt: Record<string, string> = {
  // A caged marsh flame with a grin, trailing smoke where its body should be.
  lantern: svg(
    '0 0 96 112',
    `<defs>
      <radialGradient id="rpg-l-glow"><stop offset="0" stop-color="#ffe9a3" stop-opacity=".95"/><stop offset=".45" stop-color="#ff9a3d" stop-opacity=".5"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>
      <linearGradient id="rpg-l-flame" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#ff6a2a"/><stop offset=".55" stop-color="#ffc64d"/><stop offset="1" stop-color="#fff6cf"/></linearGradient>
      <linearGradient id="rpg-l-iron" x1="0" x2="1"><stop offset="0" stop-color="#5a6488"/><stop offset=".5" stop-color="#232842"/><stop offset="1" stop-color="#0d1022"/></linearGradient>
      <linearGradient id="rpg-l-tail" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3b4470"/><stop offset="1" stop-color="#3b4470" stop-opacity="0"/></linearGradient>
    </defs>
    <circle cx="48" cy="50" r="46" fill="url(#rpg-l-glow)"/>
    <path d="M34 78c-2 12 6 16 2 30 8-6 8-12 12-12s4 8 12 12c-4-14 4-18 2-30z" fill="url(#rpg-l-tail)"/>
    <path d="M48 4a7 7 0 0 1 7 7h-4a3 3 0 0 0-6 0h-4a7 7 0 0 1 7-7z" fill="#8f9bc7"/>
    <path d="M30 22l8-11h20l8 11z" fill="url(#rpg-l-iron)" stroke="#05060f" stroke-width="2" stroke-linejoin="round"/>
    <rect x="28" y="22" width="40" height="52" rx="6" fill="#1a1230" stroke="#05060f" stroke-width="2"/>
    <path d="M48 27c11 12 15 20 15 28a15 15 0 0 1-30 0c0-8 4-16 15-28z" fill="url(#rpg-l-flame)"/>
    <path d="M48 40c5 6 7 10 7 15a7 7 0 0 1-14 0c0-5 2-9 7-15z" fill="#fff6cf" opacity=".7"/>
    <path d="M38 52l7 3-7 3zM58 52l-7 3 7 3z" fill="#2a0d05"/>
    <path d="M39 63l3 3 3-3 3 3 3-3 3 3 3-3" fill="none" stroke="#2a0d05" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M38 22v52M58 22v52" stroke="url(#rpg-l-iron)" stroke-width="3"/>
    <path d="M38 22v52M58 22v52" stroke="#05060f" stroke-opacity=".5"/>
    <path d="M26 72h44l-5 9H31z" fill="url(#rpg-l-iron)" stroke="#05060f" stroke-width="2" stroke-linejoin="round"/>
    <path d="M32 26v20" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`,
  ),

  // Jaws of silt and root, rising out of the shallows with reeds on its back.
  reedmaw: svg(
    '0 0 112 112',
    `<defs>
      <linearGradient id="rpg-r-hide" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6fae4e"/><stop offset=".6" stop-color="#2f6a35"/><stop offset="1" stop-color="#123320"/></linearGradient>
      <linearGradient id="rpg-r-throat" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7a1030"/><stop offset="1" stop-color="#1d0312"/></linearGradient>
      <radialGradient id="rpg-r-eye"><stop offset="0" stop-color="#fffbd0"/><stop offset=".5" stop-color="#ffd23a"/><stop offset="1" stop-color="#ff7a1a"/></radialGradient>
    </defs>
    <path d="M30 34c-4-12-2-22-6-30M38 30c0-12 4-18 2-28M72 30c0-10 6-18 4-27M82 34c2-10 8-16 8-24" fill="none" stroke="#8fd05e" stroke-width="3" stroke-linecap="round"/>
    <rect x="21" y="2" width="6" height="14" rx="3" fill="#5b3a1e" stroke="#1d1208"/>
    <rect x="73" y="1" width="6" height="14" rx="3" fill="#5b3a1e" stroke="#1d1208"/>
    <path d="M10 62c2-22 20-36 46-36s44 14 46 36l-10 6H20z" fill="url(#rpg-r-hide)" stroke="#07160c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M24 44c8-8 18-11 32-11" fill="none" stroke="#c6f08f" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
    <circle cx="36" cy="42" r="8" fill="#0b1f12"/><circle cx="76" cy="42" r="8" fill="#0b1f12"/>
    <circle cx="36" cy="42" r="5.5" fill="url(#rpg-r-eye)"/><circle cx="76" cy="42" r="5.5" fill="url(#rpg-r-eye)"/>
    <path d="M36 37.500v9M76 37.500v9" stroke="#1d0a00" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M12 62h88c0 20-18 34-44 34S12 82 12 62z" fill="url(#rpg-r-throat)" stroke="#07160c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M14 62l5 12 5-12 5 14 5-14 5 15 5-15 6 16 6-16 6 16 6-16 5 15 5-15 5 14 5-14 5 12 5-12z" fill="#f6f1d8" stroke="#07160c" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M26 92l5-9 5 10 6-11 6 12 8-12 8 12 6-12 6 11 5-10 5 9" fill="#f6f1d8" stroke="#07160c" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M14 90c8 12 24 18 42 18s34-6 42-18c-6 6-20 10-42 10S20 96 14 90z" fill="#2f6a35" stroke="#07160c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M2 104q10-5 20 0t20 0M70 106q10-5 20 0t20 0" fill="none" stroke="#9fe3ff" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`,
  ),

  // A barnacled shell with one claw far too big for it.
  crab: svg(
    '0 0 112 96',
    `<defs>
      <linearGradient id="rpg-c-shell" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ff8a5c"/><stop offset=".55" stop-color="#c8382a"/><stop offset="1" stop-color="#5c0f1a"/></linearGradient>
      <linearGradient id="rpg-c-claw" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ffb07a"/><stop offset="1" stop-color="#8f1c22"/></linearGradient>
      <radialGradient id="rpg-c-eye"><stop offset="0" stop-color="#eaffff"/><stop offset="1" stop-color="#39d0ff"/></radialGradient>
    </defs>
    <path d="M24 70l-14 8-4 12M32 76l-10 10v8M88 70l14 8 4 12M80 76l10 10v8" fill="none" stroke="#5c0f1a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 70l-14 8-4 12M32 76l-10 10v8M88 70l14 8 4 12M80 76l10 10v8" fill="none" stroke="#e0603e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M30 52c-10-2-16-8-18-16" fill="none" stroke="#5c0f1a" stroke-width="6" stroke-linecap="round"/>
    <path d="M4 30C2 16 12 6 26 8L16 20l14 2c0 12-10 18-18 14z" fill="url(#rpg-c-claw)" stroke="#2a0509" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M82 52c8-2 12-6 14-12" fill="none" stroke="#5c0f1a" stroke-width="5" stroke-linecap="round"/>
    <path d="M106 34c2-9-4-16-13-15l6 8-9 2c0 8 6 12 12 9z" fill="url(#rpg-c-claw)" stroke="#2a0509" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M46 40l-4-14M66 40l4-14" stroke="#5c0f1a" stroke-width="4" stroke-linecap="round"/>
    <circle cx="42" cy="24" r="6" fill="#10202c" stroke="#2a0509" stroke-width="2"/><circle cx="70" cy="24" r="6" fill="#10202c" stroke="#2a0509" stroke-width="2"/>
    <circle cx="42" cy="24" r="3.5" fill="url(#rpg-c-eye)"/><circle cx="70" cy="24" r="3.5" fill="url(#rpg-c-eye)"/>
    <path d="M18 62c0-16 16-26 38-26s38 10 38 26c0 12-16 20-38 20S18 74 18 62z" fill="url(#rpg-c-shell)" stroke="#2a0509" stroke-width="2.5"/>
    <path d="M40 38l4-9 5 8M54 36l3-10 4 10M68 37l5-8 3 9" fill="#ffd9b0" stroke="#2a0509" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M28 54c6-8 16-12 28-12" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 68q26 12 52 0" fill="none" stroke="#2a0509" stroke-opacity=".6" stroke-width="2"/>
    <circle cx="34" cy="62" r="3" fill="#e9dcc0" stroke="#2a0509"/><circle cx="76" cy="58" r="3.5" fill="#e9dcc0" stroke="#2a0509"/><circle cx="62" cy="70" r="2.5" fill="#e9dcc0" stroke="#2a0509"/>
    <path d="M48 62h6M58 62h6" stroke="#2a0509" stroke-width="2.5" stroke-linecap="round"/>`,
  ),

  // The crossing's keeper: a robed figure of standing water, crowned in coral.
  tidewarden: svg(
    '0 0 160 176',
    `<defs>
      <linearGradient id="rpg-t-body" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7fe7ff"/><stop offset=".4" stop-color="#1d86b8"/><stop offset="1" stop-color="#082346"/></linearGradient>
      <linearGradient id="rpg-t-hood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#123a6a"/><stop offset="1" stop-color="#040a22"/></linearGradient>
      <linearGradient id="rpg-t-coral" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#c2364f"/><stop offset="1" stop-color="#ffb199"/></linearGradient>
      <radialGradient id="rpg-t-aura"><stop offset="0" stop-color="#5fd6ff" stop-opacity=".55"/><stop offset="1" stop-color="#5fd6ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="rpg-t-eye"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#9ff3ff"/><stop offset="1" stop-color="#19b6ff" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="80" cy="92" rx="78" ry="82" fill="url(#rpg-t-aura)"/>
    <path d="M132 20v140" stroke="#0a1838" stroke-width="7" stroke-linecap="round"/>
    <path d="M132 20v140" stroke="#c9d6ff" stroke-width="3" stroke-linecap="round"/>
    <path d="M118 30c0-14 6-22 14-28 8 6 14 14 14 28M132 2v30" fill="none" stroke="#0a1838" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M118 30c0-14 6-22 14-28 8 6 14 14 14 28M132 2v30" fill="none" stroke="#ffd76a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 168c2-44 14-92 40-112h48c26 20 38 68 40 112z" fill="url(#rpg-t-body)" stroke="#030a1c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M52 86c-6 22-4 50 6 78M80 80c-2 30 0 58 2 86M108 86c6 24 2 52-8 78" fill="none" stroke="#c9f6ff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
    <path d="M104 70c14 2 24 10 30 24l-8 8c-6-10-14-14-24-14z" fill="url(#rpg-t-body)" stroke="#030a1c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M30 76c-8 10-12 24-12 40l12 4c2-14 6-24 14-30z" fill="url(#rpg-t-body)" stroke="#030a1c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M40 66c-12 4-20 12-22 22 10-6 22-8 34-6zM120 66c12 4 18 10 20 18-10-4-20-5-32-3z" fill="#e9dcc0" stroke="#030a1c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M44 72c0-28 14-46 36-46s36 18 36 46c-8-8-20-12-36-12s-28 4-36 12z" fill="url(#rpg-t-hood)" stroke="#030a1c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M56 62c2-16 10-26 24-26s22 10 24 26c-6-4-14-6-24-6s-18 2-24 6z" fill="#01030c"/>
    <ellipse cx="69" cy="50" rx="9" ry="6" fill="url(#rpg-t-eye)"/><ellipse cx="91" cy="50" rx="9" ry="6" fill="url(#rpg-t-eye)"/>
    <path d="M63 49l12 3M97 49l-12 3" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50 34l-4-16 8 8 2-14 8 12 4-16 6 14h8l6-14 4 16 8-12 2 14 8-8-4 16c-8-6-18-9-28-9s-20 3-28 9z" fill="url(#rpg-t-coral)" stroke="#030a1c" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="80" cy="26" r="4" fill="#9ff3ff" stroke="#030a1c" stroke-width="1.5"/>
    <path d="M4 168c10-12 22-12 32 0 10-12 22-12 32 0 10-12 22-12 32 0 10-12 22-12 32 0 8-10 16-10 24 0v8H4z" fill="#0d3c6e" stroke="#030a1c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M10 164c8-8 16-8 24 0M44 164c8-8 16-8 24 0M78 164c8-8 16-8 24 0M112 164c8-8 16-8 24 0" fill="none" stroke="#eaffff" stroke-width="3" stroke-linecap="round"/>`,
  ),
};

const bust = (body: string) => svg('0 0 64 64', body);

export const portraits: Record<string, string> = {
  // Rook: a scarred swordhand with a red headband.
  rook: bust(
    `<defs><linearGradient id="rpg-p-rook" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f08a5c"/><stop offset="1" stop-color="#5a1410"/></linearGradient></defs>
    <rect width="64" height="64" fill="url(#rpg-p-rook)"/>
    <path d="M4 64c2-12 12-18 28-18s26 6 28 18z" fill="#3d4660" stroke="#0b0d18" stroke-width="2"/>
    <path d="M18 50l14 8 14-8" fill="none" stroke="#c9d6ff" stroke-width="2.5"/>
    <rect x="26" y="38" width="12" height="10" fill="#c98d62"/>
    <path d="M18 28c0-10 6-17 14-17s14 7 14 17-6 17-14 17-14-7-14-17z" fill="#e2a678" stroke="#0b0d18" stroke-width="2"/>
    <path d="M14 26c-2-12 6-20 18-20 10 0 18 6 18 18l-6-6-4 4-6-6-6 6-6-4z" fill="#7a2416" stroke="#0b0d18" stroke-width="2" stroke-linejoin="round"/>
    <path d="M17 24h30v4H17z" fill="#e23b2e" stroke="#0b0d18"/>
    <path d="M47 26l8 4-7 2z" fill="#e23b2e" stroke="#0b0d18"/>
    <path d="M23 32h6M35 32h6" stroke="#0b0d18" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M22 29l8 1M42 29l-8 1" stroke="#4a160c" stroke-width="2" stroke-linecap="round"/>
    <path d="M38 34l4 8" stroke="#a04a3a" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M27 40h10" stroke="#0b0d18" stroke-width="2" stroke-linecap="round"/>`,
  ),

  // Seri: a mender in a green hood, a braid over one shoulder.
  seri: bust(
    `<defs><linearGradient id="rpg-p-seri" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#8fe0b0"/><stop offset="1" stop-color="#0f4a38"/></linearGradient></defs>
    <rect width="64" height="64" fill="url(#rpg-p-seri)"/>
    <path d="M4 64c2-12 12-18 28-18s26 6 28 18z" fill="#f2efe2" stroke="#0b0d18" stroke-width="2"/>
    <path d="M10 40C8 20 18 6 32 6s24 14 22 34l-6 10H16z" fill="#1f7a56" stroke="#0b0d18" stroke-width="2" stroke-linejoin="round"/>
    <path d="M19 30c0-10 5-16 13-16s13 6 13 16-5 16-13 16-13-6-13-16z" fill="#8a5a3c" stroke="#0b0d18" stroke-width="2"/>
    <path d="M18 28c2-10 8-15 16-14 6 1 10 5 12 12-8 0-14-3-18-8-2 5-5 8-10 10z" fill="#2a1a12" stroke="#0b0d18" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M24 33q3-3 6 0M34 33q3-3 6 0" fill="none" stroke="#0b0d18" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M27 39q5 4 10 0" fill="none" stroke="#0b0d18" stroke-width="2" stroke-linecap="round"/>
    <path d="M45 40c4 4 4 10 2 14s-2 6 0 10" fill="none" stroke="#2a1a12" stroke-width="5" stroke-linecap="round"/>
    <circle cx="32" cy="52" r="3.5" fill="#ffd76a" stroke="#0b0d18" stroke-width="1.5"/>`,
  ),

  // Tamsin: an arcanist under a wide hat, eyes lit from within.
  tamsin: bust(
    `<defs><linearGradient id="rpg-p-tamsin" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#b9a2ff"/><stop offset="1" stop-color="#2a1466"/></linearGradient></defs>
    <rect width="64" height="64" fill="url(#rpg-p-tamsin)"/>
    <path d="M4 64c2-12 12-18 28-18s26 6 28 18z" fill="#221a44" stroke="#0b0d18" stroke-width="2"/>
    <path d="M17 26c-2 10-2 18 2 26h26c4-8 4-16 2-26z" fill="#e9e4ff" stroke="#0b0d18" stroke-width="2" stroke-linejoin="round"/>
    <path d="M20 30c0-9 5-14 12-14s12 5 12 14-5 16-12 16-12-7-12-16z" fill="#f0c9a8" stroke="#0b0d18" stroke-width="2"/>
    <path d="M2 26c8-4 16-6 20-6L30 2l14 18c6 0 12 2 18 6-10 4-20 5-30 5S12 30 2 26z" fill="#3a2a8a" stroke="#0b0d18" stroke-width="2" stroke-linejoin="round"/>
    <path d="M22 20c6 2 14 2 22 0" fill="none" stroke="#ffd76a" stroke-width="3"/>
    <circle cx="26.5" cy="35" r="3" fill="#9ff3ff" stroke="#0b0d18" stroke-width="1.5"/><circle cx="37.5" cy="35" r="3" fill="#9ff3ff" stroke="#0b0d18" stroke-width="1.5"/>
    <path d="M28 42q4 2 8 0" fill="none" stroke="#0b0d18" stroke-width="2" stroke-linecap="round"/>
    <path d="M50 44l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" fill="#ffd76a" stroke="#0b0d18"/>`,
  ),
};
