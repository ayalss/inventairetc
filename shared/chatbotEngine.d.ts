import type { Department, Manager, Material, Puce, SubNode } from '../src/types';

export type Enriched<T> = {
  item: T;
  node?: SubNode;
  manager?: Manager;
  department?: Department;
};

export type ChatIntent = {
  isCount: boolean;
  isCost: boolean;
  isSummary: boolean;
  isPuce: boolean;
  isWhere: boolean;
  isWho: boolean;
};

export function detectTypeFilter(q: string): string[];
export function detectStatusFilter(q: string): string | null;
export function detectIntent(q: string): ChatIntent;
export function extractNameFilter(question: string): string[] | null;
export function isDirectLookup(question: string): boolean;
export function findMatchingManagers(managers: Manager[], nameTokens: string[]): Manager[];
export function directSearchMaterials(enriched: Enriched<Material>[], query: string): Enriched<Material>[];
export function directSearchPuces(enriched: Enriched<Puce>[], query: string): Enriched<Puce>[];
export function filterMaterials(
  enriched: Enriched<Material>[],
  typeKeywords: string[],
  statusFilter: string | null,
  nameTokens: string[] | null,
): Enriched<Material>[];
export function filterPuces(enriched: Enriched<Puce>[], statusFilter: string | null, nameTokens: string[] | null): Enriched<Puce>[];
export function buildAnswer(
  intent: ChatIntent,
  filteredMats: Enriched<Material>[],
  filteredPuces: Enriched<Puce>[],
  allMaterials: Material[],
  allPuces: Puce[],
  departments: Department[],
  typeKeywords: string[],
  statusFilter: string | null,
): string;
