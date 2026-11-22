// What the projects list, a project's page and a devlog work out from the front matter: how far a
// project's milestones have come, its sessions in order, its field journal by month, and its latest
// devlog. Pure functions over the fields they read, so they can be tested without a build.

export type Status = 'in progress' | 'finished';

export interface Milestone {
  title: string;
  done: boolean;
}

/** Where a milestone stands: done, in progress (the first one not done), or still to come. */
export type Stage = 'done' | 'current' | 'todo';

export function stages(milestones: readonly Milestone[]): Stage[] {
  const current = milestones.findIndex((milestone) => !milestone.done);
  return milestones.map((milestone, i) => (milestone.done ? 'done' : i === current ? 'current' : 'todo'));
}

/** The fields of a devlog these functions read. */
interface Session {
  data: { date: Date; session: number };
}

/** A day as the site writes it, `YYYY-MM-DD`. Dates arrive at midnight UTC. */
export const day = (date: Date) => date.toISOString().slice(0, 10);

/** A project's sessions in order: by session number, oldest first, as the trail steps through them. */
export function inOrder<S extends Session>(sessions: readonly S[]): S[] {
  return [...sessions].sort((a, b) => a.data.session - b.data.session || +a.data.date - +b.data.date);
}

/** The sessions newest first, by date, so a session numbered out of step still sits in its month. */
const newestFirst = <S extends Session>(sessions: readonly S[]) =>
  [...sessions].sort((a, b) => +b.data.date - +a.data.date || b.data.session - a.data.session);

/** The field journal: every session, newest first, grouped by the month it happened in, named in words. */
export function byMonth<S extends Session>(sessions: readonly S[]): { name: string; sessions: S[] }[] {
  const months: { name: string; sessions: S[] }[] = [];
  for (const session of newestFirst(sessions)) {
    const name = session.data.date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const last = months.at(-1);
    if (last?.name === name) last.sessions.push(session);
    else months.push({ name, sessions: [session] });
  }
  return months;
}

export interface Latest {
  /** The day of the latest session. */
  date: Date;
  /** How many sessions there are. */
  count: number;
}

/** The latest session's day and the number of sessions, for a project's card; none without devlogs. */
export function latest(sessions: readonly Session[]): Latest | undefined {
  const [last] = newestFirst(sessions);
  return last && { date: last.data.date, count: sessions.length };
}

/**
 * The projects list's order: those in progress before the finished ones, then the most recently
 * worked on first, then by name.
 */
export function listOrder<P extends { data: { title: string; status: Status }; latest: Latest | undefined }>(
  projects: readonly P[],
): P[] {
  const worked = (project: P) => project.latest?.date.getTime() ?? -Infinity;
  return [...projects].sort(
    (a, b) =>
      Number(a.data.status === 'finished') - Number(b.data.status === 'finished') ||
      worked(b) - worked(a) ||
      a.data.title.localeCompare(b.data.title),
  );
}
