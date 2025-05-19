// The playback part is a bit more complicated than I'd like.
// This code was also taken from my older audiobook player
// There are a acouple of layers going on because the book player had an android version as well using capacitor.

import { InjectionKey, provide, ref, Ref, shallowRef, watchEffect } from 'vue';
import { injectStrict } from 'src/compositionHelpers';
import {
  HtmlAudioPlayer,
  IAudioPlayerControls,
  IAudioPlayerState,
  ITrackPosition,
} from './audioplayer';
import { AudioPlayerPlugin, setHtmlAudioPlayer } from 'src/plugins/audioplayer';
import { ISong } from './jellyitem';
import { useSongLibrary } from 'src/stores/songlibrary';
import { useSettings } from 'src/stores/settingsStore';

export interface IBookPlayer {
  state: Ref<IAudioPlayerState>;
  player: IAudioPlayerControls;
  currentSong: Ref<ISong | undefined>;
  playlist: Ref<ISong[]>;
  updatePlaylist(newSongs: ISong[], tryKeepCurrent: boolean): Promise<void>;
  rerollSongs(firstSong?: ISong): Promise<void>;
}

const BookPlayerKey: InjectionKey<IBookPlayer> = Symbol('BookPlayerKey');
export function injectBookPlayer() {
  return injectStrict(BookPlayerKey);
}

export function setupBookPlayer(htmlPlayer: Ref<HTMLAudioElement | null>) {
  const state = ref<IAudioPlayerState>({
    isSeeking: false,
    isPlaying: false,
    isBusy: false,
    hasEnded: false,
    position: 0,
    duration: 0,
    currentTrackIndex: -1,
    tracks: [],
    volume: 100,
    mute: false,
  });

  const player = new HtmlAudioPlayer(state.value, AudioPlayerPlugin, 5);

  const currentSong = shallowRef<ISong>();
  const playlist = ref<ISong[]>([]);
  const settings = useSettings();

  // This exists because it takes a while for the htmlPlayer to be populated by the site.
  const stopWatchingHtmlPlayer = watchEffect(() => {
    if (htmlPlayer.value) {
      setHtmlAudioPlayer(htmlPlayer.value);
      stopWatchingHtmlPlayer();
    }
  });

  watchEffect(async () => {
    if (state.value.hasEnded) {
      await rerollSongs();
      player.skip_to_track(0);
    } else {
      if (state.value.currentTrackIndex < 0) {
        currentSong.value = undefined;
      } else if (state.value.currentTrackIndex < playlist.value.length) {
        currentSong.value = playlist.value[state.value.currentTrackIndex];
        if (navigator.mediaSession) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentSong.value.title,
            artist: currentSong.value.artist,
            album: currentSong.value.album,
            artwork: [
              {
                src: currentSong.value.thumbnailUrl,
                sizes: '512x512',
                type: 'image/jpeg',
              },
            ],
          });
        }
      }
    }
  });

  async function updatePlaylist(newSongs: ISong[], tryKeepCurrent: boolean) {
    playlist.value = newSongs;

    const tracks = newSongs.map((song) => {
      return { title: song.title, url: song.url };
    });

    const position: ITrackPosition | undefined =
      tryKeepCurrent && currentSong.value
        ? { track: 0, position: 0 }
        : undefined;

    await player.loadTracks(tracks, !tryKeepCurrent, position);

    if (navigator.mediaSession) {
      navigator.mediaSession.setActionHandler('play', function () {
        void player.playPause();
      });
      navigator.mediaSession.setActionHandler('pause', function () {
        void player.playPause();
      });
      navigator.mediaSession.setActionHandler('stop', function () {
        /* Code excerpted. */
      });
      navigator.mediaSession.setActionHandler('seekbackward', function () {
        void player.seekRelative(-30);
      });
      navigator.mediaSession.setActionHandler('seekforward', function () {
        void player.seekRelative(30);
      });
      navigator.mediaSession.setActionHandler('previoustrack', function () {
        void player.skip_to_previous();
      });
      navigator.mediaSession.setActionHandler('nexttrack', function () {
        void player.skip_to_next();
      });
      //navigator.mediaSession.setActionHandler('seekto', function() { /* Code excerpted. */ });
      //navigator.mediaSession.setActionHandler('skipad', function() { /* Code excerpted. */ });
    }
  }

  const songLibrary = useSongLibrary();

  async function rerollSongs(firstSong?: ISong) {
    const newSongs: ISong[] = [];

    if (firstSong) {
      newSongs.push(firstSong);
    }

    for (let i = newSongs.length; newSongs.length < settings.listLength; i++) {
      const next = await songLibrary.getRandomSong();
      if (next) {
        newSongs.push(next);
      } else {
        break;
      }
    }

    const keepCurrent = !!firstSong && firstSong === currentSong.value;
    updatePlaylist(newSongs, keepCurrent);
    window.scrollTo(0, 0);
  }

  const bookPlayer: IBookPlayer = {
    state: state,
    player: player,
    currentSong: currentSong,
    playlist: playlist,
    updatePlaylist: updatePlaylist,
    rerollSongs: rerollSongs,
  };

  provide(BookPlayerKey, bookPlayer);
  return bookPlayer;
}
