import {
  IBaseItem,
  IRatingPlaylist,
  ISong,
  IUser,
  songFromItem,
} from './jellyitem';
import axios, { AxiosInstance } from 'axios';

export class JellyfinConnection {
  constructor(
    private clientName: string,
    private deviceName: string,
    private deviceId: string,
    private version: string,
    private baseUrl: string
  ) {}

  static create(server: string) {
    return new JellyfinConnection(
      'JellyPlayer',
      'MyDevice',
      'MyId',
      '0.0.1',
      server
    );
  }

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
  private static ratingPlaylists: IRatingPlaylist[] = [];

  static async getAllSongs(api: JellyfinAPI | undefined) {
    if (!api) return [];

    const itemsResponse = await api.axios.get(`/Users/${api.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Audio',
        recursive: true,
      },
    });

    JellyfinMusic.ratingPlaylists =
      (await this.ensureRatingPlaylists(api)) ?? [];

    const ratings = new Map<string, number>();
    for (const playlist of JellyfinMusic.ratingPlaylists) {
      const playlistItems = await api.axios.get(
        `/Playlists/${playlist.id}/Items?userId=${api.userId}`
      );

      for (const item of playlistItems.data.Items) {
        ratings.set(item.Id, playlist.rating);
      }
    }

    const items = itemsResponse.data.Items as IBaseItem[];
    const songs = items.map((x) =>
      songFromItem(x, api.axios.getUri(), api.token, ratings.get(x.Id) ?? 0)
    );
    return songs;
  }

  static async ensureRatingPlaylists(api: JellyfinAPI | undefined) {
    if (!api) return;

    const playlists = await api.axios.get(`/Users/${api.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Playlist',
        recursive: true,
      },
    });

    async function ensureRatingPlaylist(rating: number) {
      if (!api) return;

      const playlist = playlists.data.Items.find(
        (x: IBaseItem) => x.Name === `Rating_${rating}`
      );

      if (!playlist) {
        console.log('Creating playlist' + rating);
        return (
          await api.axios.post('/Playlists', {
            Name: `Rating_${rating}`,
            UserId: api.userId,
            Ids: [],
            MediaType: 'Audio',
          })
        ).data.Id;
      } else {
        return playlist.Id;
      }
    }

    const ratingPlaylists: IRatingPlaylist[] = [];
    for (let i = 1; i <= 4; i++) {
      const newPlaylist: IRatingPlaylist = {
        id: await ensureRatingPlaylist(i),
        rating: i,
      };

      ratingPlaylists.push(newPlaylist);
    }

    return ratingPlaylists;
  }

  static async updateRating(
    api: JellyfinAPI | undefined,
    song: ISong,
    rating: number
  ) {
    if (!api) return;

    const currentPlaylist = JellyfinMusic.ratingPlaylists.find(
      (x) => x.rating === song.rating
    );

    const newPlaylist = JellyfinMusic.ratingPlaylists.find(
      (x) => x.rating === rating
    );

    if (currentPlaylist) {
      await this.removeFromPlaylist(api, song, currentPlaylist.id);
    }

    if (song.isFavorite && rating < 5) {
      // If the song was previously rated as a favorite, we need to remove it from the favorites list
      if (song.isFavorite) {
        await this.setFavorited(api, song, false);
      }
    }

    try {
      if (newPlaylist) {
        await this.addToPlaylist(api, song, newPlaylist.id);
      } else if (rating == 5) {
        // If the song is being rated as a favorite, we need to add it to the favorites list
        await this.setFavorited(api, song, true);
      }

      song.rating = rating;
    } catch {}
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

  static async addToPlaylist(
    api: JellyfinAPI | undefined,
    song: ISong,
    playlistId: string
  ) {
    if (!api) return;

    await api.axios.post(
      `/Playlists/${playlistId}/Items?ids=${song.id}&userId=${api.userId}`
    );
  }

  static async removeFromPlaylist(
    api: JellyfinAPI | undefined,
    song: ISong,
    playlistId: string
  ) {
    if (!api) return;

    const playlistItems = await api.axios.get(
      `/Playlists/${playlistId}/Items?userId=${api.userId}`
    );

    const entryId = playlistItems.data.Items.find(
      (x: any) => x.Id === song.id
    ).PlaylistItemId;

    await api.axios.delete(
      `/Playlists/${playlistId}/Items?EntryIds=${entryId}`
    );
  }

  static async getAlbum(api: JellyfinAPI | undefined, id: string) {
    if (!api) return;

    const albumResponse = await api.axios.get(
      `/Users/${api.userId}/Items?ids=${id}`
    );
    const albumSongs = await api.axios.get(
      `/Users/${api.userId}/Items?parentId=${id}`
    );
    albumResponse.data.Items[0].Children = albumSongs.data.Items;
    return albumResponse.data.Items[0];
  }

  static async getArtistAlbums(api: JellyfinAPI | undefined, id: string) {
    if (!api) return;

    const artistResponse = await api.axios.get(
      `/Users/${api.userId}/Items?ids=${id}`
    );
    const artistAlbums = await api.axios.get(`/Users/${api.userId}/Items`, {
      params: {
        ParentId: id,
        IncludeItemTypes: 'Album',
      },
    });
    artistResponse.data.Items[0].Children = artistAlbums.data.Items;
    return artistResponse.data.Items[0];
  }
}
