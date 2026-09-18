export interface Member {
  id: string;
  name: string;
  handle: string;
  domain: string;
  url: string;
  field: string;
  bio: string;
  proofOfWork: string;
  proofUrl: string;
  tags: string[];
  joinDate: string;
  verified: boolean;
  ringPosition: number;
  status: 'online' | 'dormant' | 'reviewing';
}

export const MEMBERS: Member[] = [
  {
    id: 'NODE-001',
    name: 'Ibrahim (Carbon)',
    handle: 'carbonthecoder',
    domain: 'carbonthecoder.github.io',
    url: 'https://carbonthecoder.github.io',
    field: 'Autonomous Agentic Systems & Sovereign Web',
    bio: 'Founder of The Uncommons. Architect of distributed cognitive loops, high-autonomy agents, and sovereign digital gardens.',
    proofOfWork: 'Agentic orchestration engines & persistent local-first knowledge systems.',
    proofUrl: 'https://github.com/carbonthecoder',
    tags: ['Founder', 'Systems', 'AI Agents', 'Architecture'],
    joinDate: '2026-01-01',
    verified: true,
    ringPosition: 1,
    status: 'online'
  },
  {
    id: 'NODE-002',
    name: 'Astraea Vance',
    handle: 'cipher_sh',
    domain: 'cipher.sh',
    url: 'https://cipher.sh',
    field: 'Formally Verified Microkernels & Systems',
    bio: 'Obsessed with capability-based security, microkernels, and formal proofs in Lean 4 and Rust. Zero-alloc kernel primitives.',
    proofOfWork: 'VeriKernel: A formally verified capability microkernel running on RISC-V with mathematical guarantees of isolation.',
    proofUrl: 'https://cipher.sh/proof/verikernel',
    tags: ['Kernels', 'Formal Methods', 'Rust', 'RISC-V'],
    joinDate: '2026-01-14',
    verified: true,
    ringPosition: 2,
    status: 'online'
  },
  {
    id: 'NODE-003',
    name: 'Dr. Kaelen Thorne',
    handle: 'hyperobject',
    domain: 'hyperobject.space',
    url: 'https://hyperobject.space',
    field: 'Discrete Spacetime & Graph Epistemology',
    bio: 'Independent theoretical physicist investigating causal graph rewriting and spacetime discretization without continuum limits.',
    proofOfWork: 'Paper & numerical proofs on lorentzian geometry emergence from relational hypergraphs.',
    proofUrl: 'https://hyperobject.space/papers/graph-lorentz',
    tags: ['Physics', 'Mathematics', 'Epistemology', 'Simulation'],
    joinDate: '2026-01-20',
    verified: true,
    ringPosition: 3,
    status: 'online'
  },
  {
    id: 'NODE-004',
    name: 'Mikhail Voronin',
    handle: 'zero_poly',
    domain: 'zero-poly.io',
    url: 'https://zero-poly.io',
    field: 'Post-Quantum Zero-Knowledge Cryptography',
    bio: 'Cryptographer researching sub-logarithmic polynomial commitments, lattice-based SNARKs, and trustless verifier machines.',
    proofOfWork: 'NovaLattice: Lattice-based folding scheme achieving post-quantum succinct zero-knowledge verification in O(1).',
    proofUrl: 'https://zero-poly.io/research/novalattice',
    tags: ['Cryptography', 'ZK-Proofs', 'Lattice', 'Privacy'],
    joinDate: '2026-02-02',
    verified: true,
    ringPosition: 4,
    status: 'online'
  },
  {
    id: 'NODE-005',
    name: 'Sora Lin',
    handle: 'latent_craft',
    domain: 'latentcraft.net',
    url: 'https://latentcraft.net',
    field: 'Recursive Reasoning Models & Symbolic AI',
    bio: 'Designing neural-symbolic hybridization where neural embeddings compile into provable First-Order Logic predicates.',
    proofOfWork: 'Symbion: Neuro-symbolic compiler that converts latent thoughts into verifiable Coq proofs.',
    proofUrl: 'https://latentcraft.net/symbion',
    tags: ['AI Research', 'Symbolic AI', 'Compilers', 'Logic'],
    joinDate: '2026-02-15',
    verified: true,
    ringPosition: 5,
    status: 'online'
  },
  {
    id: 'NODE-006',
    name: 'Elena Rostova',
    handle: 'monadology',
    domain: 'monadology.dev',
    url: 'https://monadology.dev',
    field: 'Category Theory & Esoteric Compilers',
    bio: 'Building compilers grounded in string diagrams and symmetric monoidal categories. Writing code as topological invariants.',
    proofOfWork: 'Diagramma: A visual-mathematical programming language where valid syntax is guaranteed by knot theory.',
    proofUrl: 'https://monadology.dev/diagramma',
    tags: ['Category Theory', 'Language Design', 'Math', 'Topology'],
    joinDate: '2026-02-28',
    verified: true,
    ringPosition: 6,
    status: 'online'
  },
  {
    id: 'NODE-007',
    name: 'Dexter Blake',
    handle: 'esoteric_hw',
    domain: 'esoteric-hardware.org',
    url: 'https://esoteric-hardware.org',
    field: 'Asynchronous Silicon & Optical Computing',
    bio: 'Clockless processor designer. Building asynchronous neuromorphic microchips using optical wave-guides and custom FPGA bitstreams.',
    proofOfWork: 'Chronos-0: A clockless 32-bit asynchronous CPU operating purely on self-timed wavefront transitions.',
    proofUrl: 'https://esoteric-hardware.org/chronos-0',
    tags: ['Hardware', 'Silicon', 'FPGA', 'Asynchronous'],
    joinDate: '2026-03-05',
    verified: true,
    ringPosition: 7,
    status: 'online'
  },
  {
    id: 'NODE-008',
    name: 'Lyra Chen',
    handle: 'negentropy',
    domain: 'negentropy.garden',
    url: 'https://negentropy.garden',
    field: 'Biocomputation & Molecular Information',
    bio: 'Prototyping DNA storage codecs and enzymatic cellular computing. Measuring Landauer limits on biological substrates.',
    proofOfWork: 'BioCodec: Error-correcting fountain code for dense DNA synthesis with biochemical enzymatic verification.',
    proofUrl: 'https://negentropy.garden/biocodec',
    tags: ['Biocomputing', 'DNA', 'Thermodynamics', 'Information'],
    joinDate: '2026-03-12',
    verified: true,
    ringPosition: 8,
    status: 'online'
  },
  {
    id: 'NODE-009',
    name: 'Julian Kross',
    handle: 'analog_dreams',
    domain: 'analog-dreams.cc',
    url: 'https://analog-dreams.cc',
    field: 'Continuous-Time DSP & Microtonal Synthesis',
    bio: 'Mathematician-musician engineering continuous non-linear differential equation solvers for microtonal acoustic physics.',
    proofOfWork: 'ContinuousDSP: Zero-latency 128-bit float numerical solver for non-linear acoustic vacuum tube physics.',
    proofUrl: 'https://analog-dreams.cc/dsp-solver',
    tags: ['Audio DSP', 'Physics', 'Wasm', 'Math'],
    joinDate: '2026-03-19',
    verified: true,
    ringPosition: 9,
    status: 'online'
  },
  {
    id: 'NODE-010',
    name: 'Ren Tanaka',
    handle: 'chthonic_sec',
    domain: 'chthonic.network',
    url: 'https://chthonic.network',
    field: 'Firmware Deobfuscation & Hardware Root of Trust',
    bio: 'Reverse engineer specializing in low-level microcode, side-channel power analysis, and silicon fault injection.',
    proofOfWork: 'GlitchHarness: Open hardware and firmware framework for automated voltage glitching on secure enclaves.',
    proofUrl: 'https://chthonic.network/glitch-harness',
    tags: ['Security', 'Reverse Eng', 'Firmware', 'Exploits'],
    joinDate: '2026-03-25',
    verified: true,
    ringPosition: 10,
    status: 'online'
  },
  {
    id: 'NODE-011',
    name: 'Dr. Maya Selim',
    handle: 'aleph_zero',
    domain: 'aleph-zero.pub',
    url: 'https://aleph-zero.pub',
    field: 'Homotopy Type Theory & Synthetic Geometry',
    bio: 'Researching univalent foundations and computer-verified constructive proofs for infinite-dimensional topology.',
    proofOfWork: 'HoTT-Topology: Mechanized formalization of fundamental groups of higher dimensional spheres in Cubical Agda.',
    proofUrl: 'https://aleph-zero.pub/cubical-proofs',
    tags: ['Math', 'HoTT', 'Agda', 'Topology'],
    joinDate: '2026-04-01',
    verified: true,
    ringPosition: 11,
    status: 'online'
  },
  {
    id: 'NODE-012',
    name: 'Ezekiel Vance',
    handle: 'deep_time',
    domain: 'deep-time.ink',
    url: 'https://deep-time.ink',
    field: 'Millennial Archival Systems & Glass WORM',
    bio: 'Designing self-decoding data structures designed to outlast modern silicon and be decipherable 1,000 years in the future.',
    proofOfWork: 'LithicSpec: Bytecode and graphical rosette spec designed for high-density fused silica optical etching.',
    proofUrl: 'https://deep-time.ink/lithic-spec',
    tags: ['Archival', 'Deep Time', 'Self-Decoding', 'Data'],
    joinDate: '2026-04-10',
    verified: true,
    ringPosition: 12,
    status: 'online'
  }
];

export function getNextMember(currentDomain: string): Member {
  const clean = currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const index = MEMBERS.findIndex(m => m.domain.toLowerCase() === clean);
  if (index === -1) return MEMBERS[0];
  return MEMBERS[(index + 1) % MEMBERS.length];
}

export function getPrevMember(currentDomain: string): Member {
  const clean = currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
  const index = MEMBERS.findIndex(m => m.domain.toLowerCase() === clean);
  if (index === -1) return MEMBERS[MEMBERS.length - 1];
  return MEMBERS[(index - 1 + MEMBERS.length) % MEMBERS.length];
}

export function getRandomMember(currentDomain?: string): Member {
  const clean = currentDomain ? currentDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase() : '';
  const filtered = currentDomain ? MEMBERS.filter(m => m.domain.toLowerCase() !== clean) : MEMBERS;
  const pool = filtered.length > 0 ? filtered : MEMBERS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
