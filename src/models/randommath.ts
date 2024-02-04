// Normally when you randomly pick an item from a list, each item has the same chance of being chosen
// I'd like to make it more likely to pick some items over others, whenever I like a song it should be more likely to be picked
// To accomplish this think of adding another reference to that song in the list we pick randomly from
// Now it's twice as likely to be picked than the other songs.
// You can generalize this, by mapping each item to a range across a continum.
// Think about a lucky spinning wheel that has pins. You spin the wheel, if the section for A is twice as big as for B, then twice the chance to pick it at random.

import { ISong } from './jellyitem';

export interface IWeightedGroup {
  name: string;
  weight: number;
  songs: ISong[];
}

function groupWeight(group: IWeightedGroup) {
  return group.weight * group.songs.length;
}

export function nextRandomSong(groups: IWeightedGroup[]) {
  const weights = groups.map(groupWeight);
  const totalWeight = weights.reduce((p, c) => p + c);

  const r = Math.random() * totalWeight;

  let current = 0;

  for (let index = 0; index < weights.length; index++) {
    const w = weights[index];
    if (r < current + w) {
      const ptr = ((r - current) / groups[index].weight) | 0;
      return groups[index].songs[ptr];
    }
    current += w;
  }
}
