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

  function getRandomSong() {
    return nextRandomSong(weightedGroups.value);
  }

  function setSongs(newSongs: ISong[]) {
    songs.value = newSongs;

    weightedGroups.value.push({
      weight: 10,
      name: 'favorites',
      songs: songs.value.filter((x) => x.isFavorite),
    });

    weightedGroups.value.push({
      weight: 1,
      name: 'others',
      songs: songs.value.filter((x) => !x.isFavorite),
    });
  }

  return {
    songs,
    currentSong,
    playedSongs,
    nextSongs,
    setSongs,
    getRandomSong,
  };
});
