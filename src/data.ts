import { Domain, DomainItem } from './types';

export const INITIAL_DOMAINS: Domain[] = [
  {
    id: '55d810f2-5174-4770-ae38-ca4badd69c3f',
    name: 'Computer Science',
    description: 'Core architectures, modular analysis, and harmless LLM frameworks.',
    iconColor: '#938ab3', // Purple dot
  },
  {
    id: 'c9b1fec0-e374-4b5c-a212-be2069eeb7d2',
    name: 'Quantum Sandbox',
    description: 'Experimental processing units and raw quantum mechanical simulations.',
    iconColor: '#6293a3', // Turquoise dot
  }
];

export const INITIAL_ITEMS: DomainItem[] = [
  {
    id: '62b9a117-90f1-4db8-b4b1-9f939eafbef1',
    domainId: '55d810f2-5174-4770-ae38-ca4badd69c3f',
    title: "The Hitchhiker's Guide to Program Analysis, Part III: Mostly Harmless LLMs",
    description: 'An elegant exposition of recursive state machines combined with transformer predictions, showcasing full-stack telemetry and safe prompt execution patterns.',
    domainTag: 'Computer Science',
    feasibility: 'Medium-Scope',
    status: 'Raw',
    techStacks: ['ReactJS', 'Gemini Pro', 'FastAPI'],
    year: '2026',
    type: 'item',
    color: 'lilac',
    comments: [
      {
        id: 'c1',
        author: 'System Architect',
        text: 'This system pattern looks extremely robust for AI agent pipelines.',
        timestamp: '2026-06-16 10:30'
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'f9a1fec0-e374-4b5c-a212-be2069eeb7d2',
    domainId: '55d810f2-5174-4770-ae38-ca4badd69c3f',
    title: 'Trust by design -- in praise of modularization: a case study',
    description: 'Exploring how architectural design isolation boundaries prevent systemic cascade failure in distributed backend environments.',
    domainTag: 'Computer Science',
    feasibility: 'Micro-MVP',
    status: 'Active',
    techStacks: ['FastAPI', 'Docker', 'ReactJS'],
    year: '2026',
    type: 'item',
    color: 'sky',
    comments: [],
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];
