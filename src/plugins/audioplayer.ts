import { Capacitor, registerPlugin, WebPlugin } from '@capacitor/core';
import { LocalStorage } from 'quasar';
import { ITrack, ITrackPosition } from 'src/models/audioplayer';

export interface ITimeChange {
  position: number;
  trackIndex: number;
}

export class WebAudioPlayer extends WebPlugin {
  constructor() {
    super();
  }

  setTracks(tracks: ITrack[], currentTrack: number) {
    this.tracks = tracks;
    this.index = currentTrack;
  }

  // loadUrl(request: {
  //   id: string;
  //   tracks: ITrack[];
  //   startPosition?: ITrackPosition;
  // }): Promise<void> {
  //   if (this.playerElement) {
  //     this.tracks = request.tracks;
  //     this.startTrack(request.startPosition?.track ?? 0);
  //     this.startSeek = request.startPosition?.position ?? 0;
  //     //this.currentSession = DatabaseInstance.makeSession(request.id, this.startSeek + this.currentTrackStart());
  //   }

  //   return Promise.resolve();
  // }

  seekAbsolute(request: { seconds: number }): Promise<void> {
    if (this.playerElement) {
      this.playerElement.currentTime = Math.max(
        0,
        this.currentTrackStart() + request.seconds
      );
    }

    return Promise.resolve();
  }

  setVolume(volume: number) {
    if (!this.playerElement) return;

    this.playerElement.volume = volume;
  }

  async playPause(): Promise<void> {
    if (!this.playerElement) return;

    if (this.playerElement.paused) {
      await this.playerElement.play();
    } else {
      this.playerElement.pause();
    }
  }

  skip_to_previous(): Promise<void> {
    this.startTrack(this.index - 1);
    return Promise.resolve();
  }

  skip_to_next(): Promise<void> {
    if (this.index === this.tracks.length - 1) {
      this.notifyListeners('onTrackChanged', { index: -1, ended: true });
    } else {
      this.startTrack(this.index + 1);
    }
    return Promise.resolve();
  }

  skip_to_track(request: { index: number }): Promise<void> {
    this.startTrack(request.index);
    return Promise.resolve();
  }

  setPlayer(playerElement: HTMLAudioElement) {
    playerElement.onpause = () => {
      this.notifyListeners('onPause', null);
    };

    playerElement.onplay = () => {
      if (this.startSeek) {
        playerElement.currentTime = this.startSeek + this.currentTrackStart();
        this.startSeek = undefined;
      }
      this.notifyListeners('onPlay', null);
    };

    playerElement.onloadstart = () => this.notifyListeners('onBusy', null);
    playerElement.ontimeupdate = () => {
      this.timeUpdate();
      if (this.expectedEnd && playerElement.currentTime >= this.expectedEnd) {
        this.startTrack(this.index + 1);
      }
    };
    playerElement.onloadedmetadata = () =>
      this.notifyListeners('onDurationChange', {
        duration: this.playerElement?.duration,
      });
    playerElement.ondurationchange = () =>
      this.notifyListeners('onDurationChange', {
        duration: this.playerElement?.duration,
      });
    playerElement.oncanplay = () => {
      this.notifyListeners('onCanPlay', null);
    };

    playerElement.onended = () => {
      if (this.index === this.tracks.length - 1) {
        this.notifyListeners('onTrackChanged', { index: -1, ended: true });
      } else {
        this.startTrack(this.index + 1);
      }
    };

    this.playerElement = playerElement;
    this.notifyListeners('onLoaded', null);
  }

  loadLatestPosition(request: { id: string }): Promise<ITrackPosition> {
    const position = LocalStorage.getItem(`pos:${request.id}`) as number;

    const track = LocalStorage.getItem(`track:${request.id}`) as number;

    return Promise.resolve({ position: position ?? 0, track: track ?? 0 });
  }

  private timeUpdate() {
    this.notifyListeners('timeUpdate', {
      position: this.currentTrackRelativePosition(),
    });
  }

  private startTrack(index: number) {
    if (this.playerElement && index < this.tracks.length && index >= 0) {
      const currentTrack = this.tracks[index];
      this.index = index;
      this.expectedEnd = 0;
      if (currentTrack.timeRange) {
        this.expectedEnd =
          currentTrack.timeRange?.durationSeconds +
          currentTrack.timeRange.startSeconds;
      }
      const url = currentTrack.timeRange
        ? `${currentTrack.url}#t=${currentTrack.timeRange.startSeconds},${this.expectedEnd}`
        : currentTrack.url;

      this.playerElement.src = url;
      this.notifyListeners('onTrackChanged', { index: index });
    }
  }

  private currentTrackRelativePosition() {
    if (this.playerElement) {
      return Math.max(
        0,
        this.playerElement.currentTime - this.currentTrackStart()
      );
    } else {
      return 0;
    }
  }

  private currentTrackStart() {
    return this.tracks[this.index]?.timeRange?.startSeconds ?? 0;
  }

  // remember you gotta pass objects to all arguments
  // use listener for state updates
  public playerElement: HTMLAudioElement | undefined;
  private index = 0;
  private expectedEnd = 0;
  private tracks: ITrack[] = [{ title: 'Nothing', url: '' }];
  private startSeek: number | undefined;
}

const implementations = {
  web: new WebAudioPlayer(),
};

export const AudioPlayerPlugin = registerPlugin<WebAudioPlayer>(
  'AudioPlayer',
  implementations
);

export function setHtmlAudioPlayer(playerElement: HTMLAudioElement) {
  if (!Capacitor.isNativePlatform()) {
    implementations.web.setPlayer(playerElement);
  }
}
