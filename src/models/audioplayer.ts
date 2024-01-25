import { debounce } from 'quasar';
import { ITimeChange, WebAudioPlayer } from 'src/plugins/audioplayer';

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
}

export interface IAudioPlayerControls {
  loadUrl(
    id: string,
    tracks: ITrack[],
    startPosition?: ITrackPosition
  ): Promise<void>;
  seekRelative(seconds: number): Promise<void>;
  seekAbsolute(seconds: number): Promise<void>;
  playPause(): Promise<void>;
  rewind_to_previous_chapter(): Promise<void>;
  skip_to_next_chapter(): Promise<void>;
  skip_to_track(index: number): Promise<void>;
}

export class HtmlAudioPlayer implements IAudioPlayerControls {
  constructor(
    public state: IAudioPlayerState,
    private innerPlayer: WebAudioPlayer
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
      (event: { index: number }) => {
        this.state.currentTrackIndex = event.index;
      }
    );
  }

  loadUrl(
    id: string,
    tracks: ITrack[],
    startPosition?: ITrackPosition
  ): Promise<void> {
    this.state.tracks = tracks;
    this.state.currentTrackIndex = startPosition?.track ?? 0;
    return this.innerPlayer.loadUrl({
      id: id,
      tracks: tracks,
      startPosition: startPosition,
    });
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

  async skip_to_next_chapter(): Promise<void> {
    await this.innerPlayer.skip_to_next_chapter();
  }

  async rewind_to_previous_chapter() {
    await this.innerPlayer.rewind_to_previous_chapter();
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
