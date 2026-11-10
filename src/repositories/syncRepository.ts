import type { SupabaseClient } from '@supabase/supabase-js';

import type { Wheel } from '../features/wheel/types';
import type { DecisionEntry } from '../stores/historyStore';
import type { Favorite, FavoriteKind } from '../stores/favoritesStore';

interface WheelRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_spun_at: string | null;
  wheel_options: { id: string; label: string; position: number }[];
}

/** O banco devolve "2026-11-10T01:26:36.299+00:00"; o app guarda ISO com "Z". */
const iso = (t: string) => new Date(t).toISOString();

/** Leitura e escrita dos dados da conta. RLS garante que só a própria pessoa acessa. */
export function syncRepository(client: SupabaseClient, userId: string) {
  const check = <T>(res: { data: T; error: { message: string } | null }) => {
    if (res.error) throw new Error(res.error.message);
    return res.data;
  };

  return {
    async pushWheels(wheels: Wheel[]) {
      if (wheels.length === 0) return;
      check(
        await client.from('custom_wheels').upsert(
          wheels.map((w) => ({
            id: w.id,
            user_id: userId,
            name: w.name,
            created_at: w.createdAt,
            updated_at: w.updatedAt,
            last_spun_at: w.lastSpunAt ?? null,
          })),
        ),
      );
      const ids = wheels.map((w) => w.id);
      // Opções: substitui o conjunto de cada roleta pelo atual.
      check(await client.from('wheel_options').delete().in('wheel_id', ids));
      const options = wheels.flatMap((w) =>
        w.options.map((o, position) => ({ id: o.id, wheel_id: w.id, user_id: userId, label: o.label, position })),
      );
      if (options.length) check(await client.from('wheel_options').insert(options));
    },

    async deleteWheels(ids: string[]) {
      if (ids.length) check(await client.from('custom_wheels').delete().in('id', ids));
    },

    async pullWheels(): Promise<Wheel[]> {
      const rows = check(
        await client.from('custom_wheels').select('id, name, created_at, updated_at, last_spun_at, wheel_options(id, label, position)'),
      ) as WheelRow[];
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        createdAt: iso(r.created_at),
        updatedAt: iso(r.updated_at),
        lastSpunAt: r.last_spun_at ? iso(r.last_spun_at) : undefined,
        options: [...r.wheel_options].sort((a, b) => a.position - b.position).map((o) => ({ id: o.id, label: o.label })),
      }));
    },

    async pushFavorites(items: Favorite[]) {
      const foods = items.filter((f) => f.kind === 'food').map((f) => ({ user_id: userId, recipe_id: f.id, added_at: f.addedAt }));
      const movies = items.filter((f) => f.kind === 'movie').map((f) => ({ user_id: userId, movie_id: f.id, added_at: f.addedAt }));
      if (foods.length) check(await client.from('favorite_foods').upsert(foods, { ignoreDuplicates: true }));
      if (movies.length) check(await client.from('favorite_movies').upsert(movies, { ignoreDuplicates: true }));
    },

    async deleteFavorites(keys: { kind: FavoriteKind; id: string }[]) {
      const foods = keys.filter((k) => k.kind === 'food').map((k) => k.id);
      const movies = keys.filter((k) => k.kind === 'movie').map((k) => k.id);
      if (foods.length) check(await client.from('favorite_foods').delete().in('recipe_id', foods));
      if (movies.length) check(await client.from('favorite_movies').delete().in('movie_id', movies));
    },

    async pullFavorites(): Promise<Favorite[]> {
      const foods = check(await client.from('favorite_foods').select('recipe_id, added_at')) as { recipe_id: string; added_at: string }[];
      const movies = check(await client.from('favorite_movies').select('movie_id, added_at')) as { movie_id: string; added_at: string }[];
      return [
        ...foods.map((f) => ({ kind: 'food' as const, id: f.recipe_id, addedAt: iso(f.added_at) })),
        ...movies.map((m) => ({ kind: 'movie' as const, id: m.movie_id, addedAt: iso(m.added_at) })),
      ];
    },

    async pushHistory(entries: DecisionEntry[]) {
      if (!entries.length) return;
      check(
        await client.from('decision_history').upsert(
          entries.map((e) => ({
            id: e.id,
            user_id: userId,
            kind: e.kind,
            title: e.title.slice(0, 120),
            source: e.source.slice(0, 120),
            ref_id: e.refId ?? null,
            created_at: e.createdAt,
          })),
          { ignoreDuplicates: true },
        ),
      );
    },

    async pullHistory(limit: number): Promise<DecisionEntry[]> {
      const rows = check(
        await client.from('decision_history').select('id, kind, title, source, ref_id, created_at').order('created_at', { ascending: false }).limit(limit),
      ) as { id: string; kind: DecisionEntry['kind']; title: string; source: string; ref_id: string | null; created_at: string }[];
      return rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, source: r.source, refId: r.ref_id ?? undefined, createdAt: iso(r.created_at) }));
    },

    async setDisplayName(name: string) {
      check(await client.from('profiles').update({ display_name: name || null, updated_at: new Date().toISOString() }).eq('id', userId));
    },
  };
}
