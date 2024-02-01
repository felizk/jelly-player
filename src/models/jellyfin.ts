import { IBaseItem, ISong, IUser, songFromItem } from './jellyitem';
import axios, { AxiosInstance } from 'axios';

export class JellyfinConnection {
  constructor(
    private clientName: string,
    private deviceName: string,
    private deviceId: string,
    private version: string,
    private baseUrl: string
  ) {}

  async getUsers() {
    const api = axios.create({ baseURL: this.baseUrl });

    const response = await api.get('/Users/Public', {
      headers: {
        Authorization: this.makeAuthString(''),
      },
    });
    return response.data as IUser[];
  }

  async authenticate(username: string, pw: string) {
    const api = axios.create({ baseURL: this.baseUrl });
    let token = '';

    const response = await api.post(
      '/Users/AuthenticateByName',
      {
        Username: username,
        Pw: pw,
      },
      {
        headers: {
          Authorization: this.makeAuthString(''),
        },
      }
    );

    const userId = response.data?.User?.Id;
    token = response.data['AccessToken'];
    api.defaults.headers.common['Authorization'] = this.makeAuthString(token);
    return new JellyfinAPI(api, userId, token);
  }

  async authenticateWithToken(token: string) {
    const api = axios.create({ baseURL: this.baseUrl });

    try {
      const response = await api.get('/Users/Me', {
        headers: {
          Authorization: this.makeAuthString(token),
        },
      });

      const userId = response.data?.Id;
      api.defaults.headers.common['Authorization'] = this.makeAuthString(token);
      return new JellyfinAPI(api, userId, token);
    } catch {}

    return undefined;
  }

  private makeAuthString(token: string) {
    return `MediaBrowser Client="${this.clientName}", Device="${this.deviceName}", DeviceId="${this.deviceId}", Version="${this.version}", Token="${token}"`;
  }
}

export class JellyfinAPI {
  public constructor(
    private _api: AxiosInstance,
    private _userId: string,
    private _token: string
  ) {}

  static get instance() {
    return this._instance;
  }

  static set instance(val) {
    this._instance = val;
  }

  get userId() {
    return this._userId;
  }

  get token() {
    return this._token;
  }

  get axios() {
    return this._api;
  }

  get isAuthenticated() {
    return !!this.token;
  }

  private static _instance: JellyfinAPI | undefined;
}

export class JellyfinMusic {
  static async getAllSongs(api: JellyfinAPI | undefined) {
    if (!api) return [];

    const itemsResponse = await api.axios.get(`/Users/${api.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Audio',
        recursive: true,
      },
    });

    const items = itemsResponse.data.Items as IBaseItem[];
    return items.map((x) => songFromItem(x, api.axios.getUri(), api.token));
  }

  static async setFavorited(
    api: JellyfinAPI | undefined,
    song: ISong,
    shouldBeFavorite: boolean
  ) {
    if (!api) return;

    if (shouldBeFavorite) {
      await api.axios.post(`/Users/${api.userId}/FavoriteItems/${song.id}`);
      song.isFavorite = true;
    } else {
      await api.axios.delete(`/Users/${api.userId}/FavoriteItems/${song.id}`);
      song.isFavorite = false;
    }
  }

  static async setLiked(
    api: JellyfinAPI | undefined,
    song: ISong,
    shouldBeLiked: boolean
  ) {
    if (!api) return;

    await api.axios.post(
      `/Users/${api.userId}/Items/${song.id}/Rating?likes=${shouldBeLiked}`
    );
    song.isLiked = shouldBeLiked;
  }

  static async markPlayed(api: JellyfinAPI | undefined, song: ISong) {
    if (!api) return;
    const currentDate = new Date();

    // Format the date in ISO 8601 format
    const isoDateTime = currentDate.toISOString();

    await api.axios.post(
      `/Users/${api.userId}/PlayedItems/${song.id}?datePlayed=${isoDateTime}`
    );
  }
}
