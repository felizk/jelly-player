import { LocalStorage, debounce } from 'quasar';
import { ITimeChange, WebAudioPlayer } from 'src/plugins/audioplayer';
import { watchEffect } from 'vue';

export interface ITrackPosition {
  track: number;
  position: number;
}

export interface ITimeRange {
  startSeconds: number;
  durationSeconds: number;
}

export interface ITrack {
  url: string;
  title: string;
  timeRange?: ITimeRange;
}

export interface IAudioPlayerState {
  isSeeking: boolean;
  isPlaying: boolean;
  isBusy: boolean;
  position: number;
  duration: number;
  currentTrackIndex: number;
  tracks: ITrack[];
  hasEnded: boolean;
  volume: number;
  mute: boolean;
}

export interface IAudioPlayerControls {
  loadTracks(
    tracks: ITrack[],
    playNow?: boolean,
    startPosition?: ITrackPosition
  ): Promise<void>;
  seekRelative(seconds: number): Promise<void>;
  seekAbsolute(seconds: number): Promise<void>;
  playPause(): Promise<void>;
  skip_to_previous(): Promise<void>;
  skip_to_next(): Promise<void>;
  skip_to_track(index: number): Promise<void>;
}

export class HtmlAudioPlayer implements IAudioPlayerControls {
  constructor(
    public state: IAudioPlayerState,
    private innerPlayer: WebAudioPlayer,
    private skipPreviousRewindThreshold: number
  ) {
    this.debouncedSeek = debounce((s) => this.innerSeekTo(s), 200);

    void innerPlayer.addListener(
      'onPause',
      () => (this.state.isPlaying = false)
    );
    void innerPlayer.addListener('onBusy', () => (this.state.isBusy = true));
    void innerPlayer.addListener('onPlay', () => {
      this.state.isPlaying = true;
      this.state.isBusy = false;
      this.state.hasEnded = false;
    });
    void innerPlayer.addListener('timeUpdate', (change) =>
      this.timeUpdate(change as ITimeChange)
    );
    void innerPlayer.addListener(
      'onDurationChange',
      (change: { duration: number }) => (this.state.duration = change.duration)
    );
    void innerPlayer.addListener(
      'onTrackChanged',
      (event: { index: number; ended: boolean }) => {
        if (event.ended) {
          this.state.hasEnded = true;
        }
        this.state.currentTrackIndex = event.index;
      }
    );

    void innerPlayer.addListener('onLoaded', () => {
      this.innerPlayer.setVolume(state.mute ? 0 : state.volume / 100.0);
    });

    state.volume = LocalStorage.getItem('playerVolume') ?? 100;
    state.mute = LocalStorage.getItem('playerMuted') ?? false;

    watchEffect(() => {
      this.innerPlayer.setVolume(state.mute ? 0 : state.volume / 100.0);
      LocalStorage.set('playerVolume', state.volume);
      LocalStorage.set('playerMuted', state.mute);
    });
  }

  loadTracks(
    tracks: ITrack[],
    playNow?: boolean,
    startPosition?: ITrackPosition
  ): Promise<void> {
    this.state.tracks = tracks;
    this.state.currentTrackIndex = startPosition?.track ?? -1;
    this.innerPlayer.setTracks(tracks, this.state.currentTrackIndex);

    if (playNow) {
      return this.innerPlayer.skip_to_track({
        index: this.state.currentTrackIndex,
      });
    }
    return Promise.resolve();
  }

  seekRelative(seconds: number): Promise<void> {
    this.state.isSeeking = true;
    this.state.position += seconds;
    this.debouncedSeek(this.state.position);
    return Promise.resolve();
  }

  seekAbsolute(seconds: number): Promise<void> {
    this.state.isSeeking = true;
    this.state.position = seconds;
    this.debouncedSeek(this.state.position);
    return Promise.resolve();
  }

  playPause(): Promise<void> {
    return this.innerPlayer.playPause();
  }

  async skip_to_next(): Promise<void> {
    await this.innerPlayer.skip_to_next();
  }

  async skip_to_previous() {
    if (this.state.position >= this.skipPreviousRewindThreshold) {
      return this.seekAbsolute(0);
    }

    await this.innerPlayer.skip_to_previous();
  }

  skip_to_track(index: number): Promise<void> {
    return this.innerPlayer.skip_to_track({ index: index });
  }

  loadLatestPosition(id: string) {
    return this.innerPlayer.loadLatestPosition({ id: id });
  }

  private timeUpdate(change: ITimeChange): void {
    if (!this.state.isSeeking) {
      this.state.position = change.position;
    }
  }

  private async innerSeekTo(seconds: number) {
    await this.innerPlayer.seekAbsolute({ seconds: seconds });
    this.state.isSeeking = false;
  }

  private debouncedSeek: (seconds: number) => void;
}
