import { describe, it, expect } from 'vitest';
import { nextRandomSong, IWeightedGroup } from './randommath';
import type { ISong } from './interfaces';

function makeSong(id: string): ISong {
  return {
    id,
    title: id,
    artist: 'Test',
    artistId: 'a1',
    url: '',
    thumbnailUrl: '',
    isFavorite: false,
    isLiked: false,
    rating: 0,
  };
}

describe('nextRandomSong', () => {
  it('returns a song from the group', () => {
    const groups: IWeightedGroup[] = [
      { name: 'liked', weight: 1, songs: [makeSong('s1'), makeSong('s2')] },
    ];
    const result = nextRandomSong(groups);
    expect(['s1', 's2']).toContain(result?.id);
  });

  it('returns songs from both groups across many picks', () => {
    const groups: IWeightedGroup[] = [
      { name: 'a', weight: 1, songs: [makeSong('s1')] },
      { name: 'b', weight: 1, songs: [makeSong('s2')] },
    ];
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const song = nextRandomSong(groups);
      if (song) ids.add(song.id);
    }
    expect(ids).toContain('s1');
    expect(ids).toContain('s2');
  });

  it('heavily weighted group dominates picks', () => {
    const groups: IWeightedGroup[] = [
      { name: 'rare', weight: 1, songs: [makeSong('rare')] },
      { name: 'common', weight: 100, songs: [makeSong('common')] },
    ];
    const counts: Record<string, number> = { rare: 0, common: 0 };
    for (let i = 0; i < 200; i++) {
      const song = nextRandomSong(groups);
      if (song) counts[song.id]++;
    }
    expect(counts['common']).toBeGreaterThan(counts['rare'] * 5);
  });
});
