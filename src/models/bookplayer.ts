import {
  InjectionKey,
  provide,
  ref,
  Ref,
  shallowRef,
  watch,
  watchEffect,
} from 'vue';

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

export interface IBookPlayer {
  state: Ref<IAudioPlayerState>;
  player: IAudioPlayerControls;
  currentSong: Ref<ISong | undefined>;
  playlist: Ref<ISong[]>;
  updatePlaylist(newSongs: ISong[], tryKeepCurrent: boolean): void;
  rerollSongs(keepCurrent: boolean): Promise<void>;
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
  const thumbnail = ref<string>();
  const playlist = ref<ISong[]>([]);

  // This exists because it takes a while for the htmlPlayer to be populated by the site.
  const stopWatchingHtmlPlayer = watchEffect(() => {
    if (htmlPlayer.value) {
      setHtmlAudioPlayer(htmlPlayer.value);
      stopWatchingHtmlPlayer();
    }
  });

  watchEffect(() => {
    if (state.value.hasEnded) {
      rerollSongs(false);
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

  // watchEffect(() => {
  //   player.setVolume(state.volume);
  // });

  //let seekingWithoutUndo = false;

  // watch(
  //   () => state.value.position,
  //   (newValue, oldValue) => {
  //     if(oldValue != 0 && Math.abs(newValue - oldValue) > 60) {
  //       if(!seekingWithoutUndo) {
  //         sessionState.value.longSeekHistory.push({ track: state.value.currentTrackIndex, position: oldValue });
  //         sessionState.value.lastLongSeekTime = Date.now();
  //       }
  //     }

  //     if(sessionState.value.longSeekHistory.length > 0 && (Date.now() - sessionState.value.lastLongSeekTime) > 15000) {
  //       sessionState.value.longSeekHistory = [];
  //     }
  //    }
  // );

  // TODO: FIX UNDO

  async function updatePlaylist(newSongs: ISong[], tryKeepCurrent: boolean) {
    if (tryKeepCurrent && currentSong.value) {
      newSongs.splice(0, 0, currentSong.value);
    }

    //currentSong.value = newSongs[0];
    thumbnail.value = newSongs[0].thumbnailUrl;
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

  async function rerollSongs(keepCurrent: boolean) {
    // let items = songLibrary.songs;

    const newSongs: ISong[] = [];

    for (let i = 0; i < 20; i++) {
      const next = await songLibrary.getRandomSong();
      if (next) {
        newSongs.push(next);
      }
    }

    updatePlaylist(newSongs, keepCurrent);

    if (!keepCurrent) {
      player.skip_to_track(0);
    }

    // songLibrary.nextSongs = newSongs;
    // let idx = (Math.random() * items.length) | 0;
    // let item = items[idx];

    //bookPlayer.loadSong(item);
  }

  // const seekWithoutUndo = async (newPosition:number) => {
  //   if(seekingWithoutUndo) {
  //     return;
  //   }

  //   seekingWithoutUndo = true;
  //   await player.seekAbsolute(newPosition);
  // };

  // const undoLongSeek = async () => {
  //   if(seekingWithoutUndo) {
  //     return;
  //   }

  //   await seekWithoutUndo(sessionState.value.longSeekHistory.pop() ?? 0);
  // }

  void rerollSongs(true);

  const bookPlayer: IBookPlayer = {
    state: state,
    player: player,
    currentSong: currentSong,
    playlist: playlist,
    updatePlaylist: updatePlaylist,
    rerollSongs: rerollSongs,
    //undoLongSeek: undoLongSeek,
    //seekWithoutUndo: seekWithoutUndo
  };

  provide(BookPlayerKey, bookPlayer);
  return bookPlayer;
}
