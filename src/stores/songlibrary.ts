// I'm honestly not sure a store is right for this. Haven't quite nailed dependency injection in Vue yet.

import { defineStore } from 'pinia';
import { ISong } from 'src/models/jellyitem';
import { IWeightedGroup, nextRandomSong } from 'src/models/randommath';
import { ref } from 'vue';

export const useSongLibrary = defineStore('songLibrary', () => {
  const songs = ref<ISong[]>([]);
  const lookup = new Map<string, ISong>();

  const weightedGroups = ref<IWeightedGroup[]>([]);

  const favoritePercentage = ref(50);

  function getRandomSong() {
    return nextRandomSong(weightedGroups.value);
  }

  function setSongs(newSongs: ISong[]) {
    songs.value = newSongs;
    lookup.clear();
    newSongs.forEach((x) => lookup.set(x.id, x));
    updateWeights();
  }

  function updateWeights() {
    // This algorithm is a bit complex, but it's designed to give a good mix of favorites and non-favorites
    // while also taking into account the user's favoritePercentage setting. It's a bit of a balancing act.
    // The basic idea is to give a weight to each song based on its rating, and then distribute the remaining
    // weight among the non-favorite songs. The favorite songs are given a weight based on the favoritePercentage
    // setting, and the non-favorite songs are given a weight based on their rating. Then we use a weighted random
    // selection algorithm to pick the next song.

    const candidates = songs.value.filter((x) => x.rating != 1);

    const favorites = candidates.filter((x) => x.isFavorite);
    const rest = candidates.filter((x) => !x.isFavorite);

    const rating4Weight = 4;
    const rating3Weight = 2;
    const rating2Weight = 1;

    // group rest by rating
    const restByRating: ISong[][] = [];
    for (let i = 0; i < 3; i++) {
      restByRating.push([]);
    }

    rest.forEach((song) => {
      // Rating 0 is treated as rating 3
      if (song.rating == 0) {
        restByRating[0].push(song);
      } else {
        restByRating[song.rating - 2].push(song);
      }
    });

    const restWeight =
      restByRating[0].length * rating2Weight +
      restByRating[1].length * rating3Weight +
      restByRating[2].length * rating4Weight;

    const favoriteRatio = favoritePercentage.value / 100;
    const restRatio = 1 - favoriteRatio;
    const combinedWeight = restWeight * (1 / restRatio);
    const weightPerFavorite =
      (combinedWeight * favoriteRatio) / favorites.length;

    weightedGroups.value = [];

    weightedGroups.value.push({
      weight: weightPerFavorite,
      name: 'favorites',
      songs: favorites,
    });

    weightedGroups.value.push({
      weight: rating4Weight,
      name: 'rating 4',
      songs: restByRating[2],
    });

    weightedGroups.value.push({
      weight: rating3Weight,
      name: 'rating 3',
      songs: restByRating[1],
    });

    weightedGroups.value.push({
      weight: rating2Weight,
      name: 'rating 2 & 0',
      songs: restByRating[0],
    });
  }

  return {
    favoritePercentage,
    updateWeights,
    songs,
    lookup,
    setSongs,
    getRandomSong,
  };
});
