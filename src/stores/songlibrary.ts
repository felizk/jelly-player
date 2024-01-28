import axios from 'axios';
import { defineStore } from 'pinia';
import { JellyfinMusic } from 'src/models/jellyfin';
import { ISong } from 'src/models/jellyitem';
import { IWeightedGroup, nextRandomSong } from 'src/models/randommath';
import { ref } from 'vue';

export const useSongLibrary = defineStore('songLibrary', () => {
  const songs = ref<ISong[]>([]);
  const currentSong = ref<ISong>();

  const playedSongs = ref<ISong[]>([]);
  const nextSongs = ref<ISong[]>([]);

  const weightedGroups = ref<IWeightedGroup[]>([]);

  const api = axios.create({ baseURL: 'http://192.168.0.19:8096' });
  const jellyMusic = new JellyfinMusic(
    api,
    'JellyPlayer',
    'MyDevice',
    'MyId',
    '0.0.1',
    'felizk',
    ''
  );

  const loadPromise = loadSongs();

  async function loadSongs() {
    if (await jellyMusic.authenticate()) {
      songs.value = await jellyMusic.getAllSongs();

      // This needs to be changed. We want to weigh the favorites so we get a favorite every 7 songs'ish
      // That means the total weight of favorites should be 1/7th of all weights MATH
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
  }

  async function getRandomSong() {
    await loadPromise;
    return nextRandomSong(weightedGroups.value);
  }

  async function favorite(song: ISong) {
    await jellyMusic.setFavorited(song, !song.isFavorite);
    //await markPlayed(song);
    song.isFavorite = !song.isFavorite;
  }

  async function like(song: ISong) {
    await jellyMusic.setLiked(song, !song.isLiked);
    song.isLiked = !song.isLiked;
  }

  return {
    songs,
    currentSong,
    playedSongs,
    nextSongs,
    getRandomSong,
    favorite,
    like,
  };
});
