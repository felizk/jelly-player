import { defineStore } from 'pinia';
import { ISong } from 'src/models/jellyitem';
import { IWeightedGroup, nextRandomSong } from 'src/models/randommath';
import { ref } from 'vue';

export const useSongLibrary = defineStore('songLibrary', () => {
  const songs = ref<ISong[]>([]);
  const currentSong = ref<ISong>();

  const playedSongs = ref<ISong[]>([]);
  const nextSongs = ref<ISong[]>([]);

  const weightedGroups = ref<IWeightedGroup[]>([]);

  const favoritePercentage = ref(50);

  function getRandomSong() {
    return nextRandomSong(weightedGroups.value);
  }

  function setSongs(newSongs: ISong[]) {
    songs.value = newSongs;
    updateWeights();
  }

  function updateWeights() {
    // Whenever we generate 10 random songs, we want to get 8 favorites and 2 others.
    // To do this we have to balance the weights so that the total weight of favorites is 4 times the weight of others.

    const favorites = songs.value.filter((x) => x.isFavorite);
    const rest = songs.value.filter((x) => !x.isFavorite);

    const favoriteRatio = favoritePercentage.value / 100;
    const restRatio = 1 - favoriteRatio;
    const combinedWeight = rest.length * (1 / restRatio);
    const weightPerFavorite =
      (combinedWeight * favoriteRatio) / favorites.length;

    weightedGroups.value = [];

    weightedGroups.value.push({
      weight: weightPerFavorite,
      name: 'favorites',
      songs: favorites,
    });

    weightedGroups.value.push({
      weight: 1,
      name: 'others',
      songs: rest,
    });
  }

  return {
    favoritePercentage,
    updateWeights,
    songs,
    currentSong,
    playedSongs,
    nextSongs,
    setSongs,
    getRandomSong,
  };
});
