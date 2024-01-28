import { InjectionKey } from 'vue';
import { IBaseItem, ISong, songFromItem } from './jellyitem';
import { AxiosInstance } from 'axios';
import { injectStrict } from 'src/compositionHelpers';

export class JellyfinAPI {
  constructor(
    public api: AxiosInstance,
    private clientName: string,
    private deviceName: string,
    private deviceId: string,
    private version: string,
    private username: string,
    private pw: string
  ) {}

  async authenticate() {
    try {
      const response = await this.api.post(
        '/Users/AuthenticateByName',
        {
          Username: this.username,
          Pw: this.pw,
        },
        {
          headers: {
            Authorization: this.makeAuthString(),
          },
        }
      );

      this.userId = response.data?.User?.Id;
      this.token = response.data['AccessToken'];
      this.api.defaults.headers.common['Authorization'] = this.makeAuthString();
      return true;
    } catch {}
    return false;
  }

  getUserId() {
    return this.userId;
  }

  isAuthenticated() {
    return !!this.token;
  }

  private makeAuthString() {
    return `MediaBrowser Client="${this.clientName}", Device="${this.deviceName}", DeviceId="${this.deviceId}", Version="${this.version}", Token="${this.token}"`;
  }

  protected token = '';
  protected userId = '';
}

export class JellyfinMusic extends JellyfinAPI {
  async getAllSongs() {
    const itemsResponse = await this.api.get(`/Users/${this.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Audio',
        recursive: true,
      },
    });

    const items = itemsResponse.data.Items as IBaseItem[];
    return items.map((x) => songFromItem(x, this.api.getUri(), this.token));
  }

  async setFavorited(song: ISong, shouldBeFavorite: boolean) {
    if (shouldBeFavorite) {
      await this.api.post(`/Users/${this.userId}/FavoriteItems/${song.id}`);
    } else {
      await this.api.delete(`/Users/${this.userId}/FavoriteItems/${song.id}`);
    }
  }

  async setLiked(song: ISong, shouldBeLiked: boolean) {
    await this.api.post(
      `/Users/${this.userId}/Items/${song.id}/Rating?likes=${shouldBeLiked}`
    );
  }

  async markPlayed(song: ISong) {
    const currentDate = new Date();

    // Format the date in ISO 8601 format
    const isoDateTime = currentDate.toISOString();

    await this.api.post(
      `/Users/${this.userId}/PlayedItems/${song.id}?datePlayed=${isoDateTime}`
    );
  }
}

export const JellyfinMusicKey: InjectionKey<JellyfinMusic> =
  Symbol('JellyfinMusicKey');

export function injectJellyfinMusic() {
  return injectStrict(JellyfinMusicKey);
}
