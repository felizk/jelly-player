import { InjectionKey, provide, ref, Ref, shallowRef, watchEffect } from 'vue';

import { injectStrict } from 'src/compositionHelpers';
import {
  HtmlAudioPlayer,
  IAudioPlayerControls,
  IAudioPlayerState,
} from './audioplayer';
import { AudioPlayerPlugin, setHtmlAudioPlayer } from 'src/plugins/audioplayer';
import { ISong } from './jellyitem';

export interface IBookPlayer {
  state: Ref<IAudioPlayerState>;
  player: IAudioPlayerControls;
  song: Ref<ISong | undefined>;
  thumbnail: Ref<string | undefined>;
  loadSong(book: ISong): void;
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
    position: 0,
    duration: 0,
    currentTrackIndex: -1,
    tracks: [{ url: '', title: 'Nothing' }],
  });

  const player = new HtmlAudioPlayer(state.value, AudioPlayerPlugin);

  const currentSong = shallowRef<ISong>();
  const thumbnail = ref<string>();

  const stopWatchingHtmlPlayer = watchEffect(() => {
    if (htmlPlayer.value) {
      setHtmlAudioPlayer(htmlPlayer.value);
      stopWatchingHtmlPlayer();
    }
  });

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

  async function loadSong(song: ISong) {
    currentSong.value = song;
    thumbnail.value = song.thumbnailUrl;

    await player.loadUrl('test', [{ title: song.title, url: song.url }]);

    // if (navigator.mediaSession) {
    //   navigator.mediaSession.metadata = new MediaMetadata({
    //     title: book.title,
    //     artist: book.authors,
    //     artwork: [
    //       {
    //         src: book.thumbnailUrl,
    //         sizes: '512x512',
    //         type: 'image/jpeg'
    //       }
    //     ]
    //   });

    //   navigator.mediaSession.setActionHandler('play', function() {
    //     void player.playPause();
    //   });
    //   navigator.mediaSession.setActionHandler('pause', function() {
    //     void player.playPause();
    //   });
    //   navigator.mediaSession.setActionHandler('stop', function() {
    //     /* Code excerpted. */
    //   });
    //   navigator.mediaSession.setActionHandler('seekbackward', function() {
    //     void player.seekRelative(-30);
    //   });
    //   navigator.mediaSession.setActionHandler('seekforward', function() {
    //     void player.seekRelative(30);
    //   });
    //   navigator.mediaSession.setActionHandler('previoustrack', function() {
    //     void player.seekRelative(-30);
    //   });
    //   navigator.mediaSession.setActionHandler('nexttrack', function() {
    //     void player.seekRelative(30);
    //   });
    //   //navigator.mediaSession.setActionHandler('seekto', function() { /* Code excerpted. */ });
    //   //navigator.mediaSession.setActionHandler('skipad', function() { /* Code excerpted. */ });
    // }
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

  const bookPlayer: IBookPlayer = {
    state: state,
    player: player,
    song: currentSong,
    thumbnail: thumbnail,
    loadSong: loadSong,
    //undoLongSeek: undoLongSeek,
    //seekWithoutUndo: seekWithoutUndo
  };

  provide(BookPlayerKey, bookPlayer);
  return bookPlayer;
}
