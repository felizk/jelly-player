import { IBaseItem, IRatingPlaylist, ISong, IUser } from './jellyitem';
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
    return new JellyfinAPI(api, userId, response.data?.ServerId, token);
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
      return new JellyfinAPI(api, userId, response.data?.ServerId, token);
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
    private _serverId: string,
    private _token: string
  ) {}

  static get instance() {
    return this._instance as JellyfinAPI;
  }

  static setInstance(val: JellyfinAPI | undefined) {
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

  private ratingPlaylists: IRatingPlaylist[] = [];

  async getAllSongs() {
    const itemsResponse = await this.axios.get(`/Users/${this.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Audio',
        recursive: true,
      },
    });

    this.ratingPlaylists = (await this.ensureRatingPlaylists()) ?? [];

    const ratings = new Map<string, number>();
    for (const playlist of this.ratingPlaylists) {
      const playlistItems = await this.axios.get(
        `/Playlists/${playlist.id}/Items?userId=${this.userId}`
      );

      for (const item of playlistItems.data.Items) {
        ratings.set(item.Id, playlist.rating);
      }
    }

    const items = itemsResponse.data.Items as IBaseItem[];
    const songs = items.map((x) =>
      this.songFromItem(x, ratings.get(x.Id) ?? 0)
    );
    return songs;
  }

  async ensureRatingPlaylists() {
    const playlists = await this.axios.get(`/Users/${this.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Playlist',
        recursive: true,
      },
    });

    const ensureRatingPlaylist = async (rating: number) => {
      const playlist = playlists.data.Items.find(
        (x: IBaseItem) => x.Name === `Rating_${rating}`
      );

      if (!playlist) {
        return (
          await this.axios.post('/Playlists', {
            Name: `Rating_${rating}`,
            UserId: this.userId,
            Ids: [],
            MediaType: 'Audio',
          })
        ).data.Id;
      } else {
        return playlist.Id;
      }
    };

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

  async updateRating(song: ISong, rating: number) {
    const currentPlaylist = this.ratingPlaylists.find(
      (x) => x.rating === song.rating
    );

    const newPlaylist = this.ratingPlaylists.find((x) => x.rating === rating);

    if (currentPlaylist) {
      await this.removeFromPlaylist(song, currentPlaylist.id);
    }

    if (song.isFavorite && rating < 5) {
      // If the song was previously rated as a favorite, we need to remove it from the favorites list
      if (song.isFavorite) {
        await this.setFavorited(song, false);
      }
    }

    try {
      if (newPlaylist) {
        await this.addToPlaylist(song, newPlaylist.id);
      } else if (rating == 5) {
        // If the song is being rated as a favorite, we need to add it to the favorites list
        await this.setFavorited(song, true);
      }

      song.rating = rating;
    } catch {}
  }

  async setFavorited(song: ISong, shouldBeFavorite: boolean) {
    if (shouldBeFavorite) {
      await this.axios.post(`/Users/${this.userId}/FavoriteItems/${song.id}`);
      song.isFavorite = true;
    } else {
      await this.axios.delete(`/Users/${this.userId}/FavoriteItems/${song.id}`);
      song.isFavorite = false;
    }
  }

  async setLiked(song: ISong, shouldBeLiked: boolean) {
    await this.axios.post(
      `/Users/${this.userId}/Items/${song.id}/Rating?likes=${shouldBeLiked}`
    );
    song.isLiked = shouldBeLiked;
  }

  async markPlayed(song: ISong) {
    const currentDate = new Date();

    // Format the date in ISO 8601 format
    const isoDateTime = currentDate.toISOString();

    await this.axios.post(
      `/Users/${this.userId}/PlayedItems/${song.id}?datePlayed=${isoDateTime}`
    );
  }

  async addToPlaylist(song: ISong, playlistId: string) {
    await this.axios.post(
      `/Playlists/${playlistId}/Items?ids=${song.id}&userId=${this.userId}`
    );
  }

  async removeFromPlaylist(song: ISong, playlistId: string) {
    const playlistItems = await this.axios.get(
      `/Playlists/${playlistId}/Items?userId=${this.userId}`
    );

    const entryId = playlistItems.data.Items.find(
      (x: any) => x.Id === song.id
    ).PlaylistItemId;

    await this.axios.delete(
      `/Playlists/${playlistId}/Items?EntryIds=${entryId}`
    );
  }

  async getAlbumAndSongs(id: string) {
    const albumResponse = await this.axios.get(
      `/Users/${this.userId}/Items?ids=${id}`
    );
    const albumSongs = await this.axios.get(
      `/Users/${this.userId}/Items?parentId=${id}`
    );
    albumResponse.data.Items[0].Children = albumSongs.data.Items;
    return albumResponse.data.Items[0];
  }

  async getArtistAlbums(id: string) {
    const artistResponse = await this.axios.get(
      `/Users/${this.userId}/Items?ids=${id}`
    );
    const artistAlbums = await this.axios.get(`/Users/${this.userId}/Items`, {
      params: {
        ParentId: id,
        IncludeItemTypes: 'Album',
      },
    });
    artistResponse.data.Items[0].Children = artistAlbums.data.Items;
    return artistResponse.data.Items[0];
  }

  makePrimaryImageUrl(item: IBaseItem) {
    return this.makeImageUrl(item.Id, 'Primary', item.ImageTags.Primary);
  }

  makeLogoImageUrl(item: IBaseItem) {
    return this.makeImageUrl(item.Id, 'Logo', item.ImageTags.Logo);
  }

  makeImageUrl(itemId: string, type: string, tag?: string) {
    const tagParam = tag ? `&tag=${tag}` : '';
    return `${this.axios.getUri()}/Items/${itemId}/Images/${type}?api_key=${
      this.token
    }${tagParam}`;
  }

  makeJellyfinItemUrl(itemId: string) {
    return `${this.axios.getUri()}/web/index.html#!/item?id=${itemId}&serverId=${
      this._serverId
    }`;
  }

  songFromItem(item: IBaseItem, rating?: number): ISong {
    let thumbnailUrl = '';

    // Fallback to album image if no primary image is available
    if (item.ImageTags.Primary) {
      thumbnailUrl = this.makeImageUrl(
        item.Id,
        'Primary',
        item.ImageTags.Primary
      );
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
      thumbnailUrl = this.makeImageUrl(
        item.AlbumId,
        'Primary',
        item.AlbumPrimaryImageTag
      );
    }

    if (item.UserData.IsFavorite) {
      rating = 5;
    }

    return {
      id: item.Id,
      title: item.Name,
      album: item.Album,
      albumId: item.AlbumId,
      artist: item.ArtistItems[0]?.Name ?? 'Unknown',
      artistId: item.ArtistItems[0]?.Id ?? '',
      url: this.getAudioStreamUrl(item.Id),
      thumbnailUrl: thumbnailUrl,
      isFavorite: item.UserData.IsFavorite,
      isLiked: item.UserData.Likes,
      rating: rating ?? 0,
    };
  }

  getAudioStreamUrl(itemId: string) {
    return `${this.axios.getUri()}/Audio/${itemId}/universal?ApiKey=${
      this._token
    }`;
  }

  private static _instance: JellyfinAPI | undefined;
}
