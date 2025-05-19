import { IBaseItem, IPlaylist, IRatingPlaylist, ISong, IUser } from './jellyitem';
import axios, { AxiosInstance } from 'axios';

/**
 * This class is used to connect to a Jellyfin server and authenticate with it.
 */
export class JellyfinConnection {
  constructor(
    private clientName: string,
    private deviceName: string,
    private deviceId: string,
    private version: string,
    private baseUrl: string
  ) { }

  /**
   * A helper that puts in the "Device" information for this Jellyfin client.
   *
   * @param server the server url
   * @returns a connection object
   */
  static create(server: string) {
    const agent = window.navigator.userAgent;

    let id = localStorage.getItem('jellyfin-client-id')
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('jellyfin-client-id', id);
    }

    return new JellyfinConnection(
      'JellyPlayer',
      agent,
      id,
      '0.0.1',
      server
    );
  }

  /**
   * Get a list of public users on the server.
   *
   * @returns a list of users
   */
  async getPublicUsers() {
    const api = axios.create({ baseURL: this.baseUrl });

    const response = await api.get('/Users/Public', {
      headers: {
        Authorization: this.makeAuthString(''),
      },
    });
    return response.data as IUser[];
  }

  /**
   * Authenticate with a username and password. Uses the /Users/AuthenticateByName endpoint.
   *
   * @param username the username
   * @param pw the password
   * @returns a JellyfinAPI object
   */
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

  /**
   * Authenticate with a token. Tries to reuse the token to get information about the user.
   *
   * @param token the token
   * @returns a JellyfinAPI object
   */
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
    } catch { }

    return undefined;
  }

  private makeAuthString(token: string) {
    return `MediaBrowser Client="${this.clientName}", Device="${this.deviceName}", DeviceId="${this.deviceId}", Version="${this.version}", Token="${token}"`;
  }
}

/**
 * This class is used to interact with a Jellyfin server.
 * At the point you have one of these, you've already gone through authentication etc.
 */
export class JellyfinAPI {
  public constructor(
    private _api: AxiosInstance,
    private _userId: string,
    private _serverId: string,
    private _token: string
  ) { }

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
  /**
   * Get all songs on the server.
   * This is a recursive call, so it will get all songs in all libraries.
   * This also creates the rating playlists if they don't exist.
   *
   * @returns a list of songs
   */
  async getAllSongs() {
    const itemsResponse = await this.axios.get(`/Users/${this.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Audio',
        recursive: true,
      },
    });

    await this.ensureRatingPlaylists();

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

  /**
   * This gets or creates a playlist for every rating between 0 and 5 (exclusive).
   * This is because setting the user rating on jellyfin isn't actually supported at the moment.
   * It's a hacky way to get around that. :)
   */
  private async ensureRatingPlaylists() {
    this.ratingPlaylists = [];

    const playlists = await this.axios.get(`/Users/${this.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Playlist',
        recursive: true,
      },
    });

    const ensureRatingPlaylist = async (playlistName: string) => {
      const playlist = playlists.data.Items.find(
        (x: IBaseItem) => x.Name === playlistName
      );

      if (!playlist) {
        return (
          await this.axios.post('/Playlists', {
            Name: playlistName,
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
        id: await ensureRatingPlaylist(`Rating_${i}`),
        rating: i,
      };

      ratingPlaylists.push(newPlaylist);
    }

    this.ratingPlaylists = ratingPlaylists;
  }

  /**
   * This sets the rating of this song on the server. It uses playlists to do this because setting a user rating isn't supported yet.
   *
   * @param song the song to rate
   * @param rating the rating to give the song
   */
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
    } catch { }
  }

  /**
   * This sets the song as a favorite or not on the server.
   *
   * @param song the song to favorite
   * @param shouldBeFavorite whether the song should be favorited
   */
  async setFavorited(song: ISong, shouldBeFavorite: boolean) {
    if (shouldBeFavorite) {
      await this.axios.post(`/Users/${this.userId}/FavoriteItems/${song.id}`);
      song.isFavorite = true;
    } else {
      await this.axios.delete(`/Users/${this.userId}/FavoriteItems/${song.id}`);
      song.isFavorite = false;
    }
  }

  /**
   * This sets the song as liked or not on the server.
   *
   * @param song the song to like
   * @param shouldBeLiked whether the song should be liked
   */
  async setLiked(song: ISong, shouldBeLiked: boolean) {
    await this.axios.post(
      `/Users/${this.userId}/Items/${song.id}/Rating?likes=${shouldBeLiked}`
    );
    song.isLiked = shouldBeLiked;
  }

  /**
   * This marks the song as played on the server.
   *
   * @param song the song to mark as played
   */
  async markPlayed(song: ISong) {
    const currentDate = new Date();

    // Format the date in ISO 8601 format
    const isoDateTime = currentDate.toISOString();

    await this.axios.post(
      `/Users/${this.userId}/PlayedItems/${song.id}?datePlayed=${isoDateTime}`
    );
  }

  async getPlaylists() {
    const playlists = await this.axios.get(`/Users/${this.userId}/Items`, {
      params: {
        IncludeItemTypes: 'Playlist',
        recursive: true,
        fields: 'Path,ChildCount,Container',
      },
    });

    return (playlists.data.Items as IBaseItem[])
      .filter(x => !x.Name.startsWith('Rating_') && !x.Name.startsWith('JellyTube') && x.Path?.endsWith('.m3u') != true)
      .map(x => this.playlistFromItem(x));
  }

  playlistFromItem(item: IBaseItem): IPlaylist {
    let thumbnailUrl = '';

    // Fallback to album image if no primary image is available
    if (item.ImageTags.Primary) {
      thumbnailUrl = this.makeImageUrl(
        item.Id,
        'Primary',
        item.ImageTags.Primary
      );
    }

    return {
      id: item.Id,
      title: item.Name,
      thumbnailUrl: thumbnailUrl,
    };
  }

  async getPlaylistItems(id: string) {
    const albumSongs = await this.axios.get(
      `/Playlists/${id}/Items`
    );

    return albumSongs.data.Items as IBaseItem[];
  }

  /**
   * Adds a song to a playlist.
   *
   * @param song the song to add
   * @param playlistId the playlist to add the song to
   */
  async addToPlaylist(song: ISong, playlistId: string) {
    await this.axios.post(
      `/Playlists/${playlistId}/Items?ids=${song.id}&userId=${this.userId}`
    );
  }

  /**
   * Removes a song from a playlist.
   *
   * @param song the song to remove
   * @param playlistId the playlist to remove the song from
   */
  async removeFromPlaylist(song: ISong, playlistId: string) {
    // Annoyingly, to remove an item you don't use the item ID, but an "entryId"
    // So we gotta go find the entry id for this song first.
    const playlistItems = await this.axios.get(
      `/Playlists/${playlistId}/Items?userId=${this.userId}`
    );

    const entryId = playlistItems.data.Items.find(
      (x: IBaseItem) => x.Id === song.id
    ).PlaylistItemId;

    await this.axios.delete(
      `/Playlists/${playlistId}/Items?EntryIds=${entryId}`
    );
  }

  /**
   * Gets an album and all the songs for the album.
   *
   * @param id the album id
   * @returns the album and all the songs in it
   */
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

  /**
   * Gets an artist and all the albums for the artist.
   *
   * @param id the artist id
   * @returns the artist and all the albums in it
   */
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

  /**
   * Makes the URL for the primary image of an item.
   *
   * @param item the item to get the primary image for
   * @returns an url
   */
  makePrimaryImageUrl(item: IBaseItem) {
    return this.makeImageUrl(item.Id, 'Primary', item.ImageTags.Primary);
  }

  /**
   * Makes the URL for the logo image of an item.
   *
   * @param item the item to get the logo image for
   * @returns an url
   */
  makeLogoImageUrl(item: IBaseItem) {
    return this.makeImageUrl(item.Id, 'Logo', item.ImageTags.Logo);
  }

  /**
   * Makes the URL for an image of an item.
   *
   * @param itemId the item id
   * @param type the type of image
   * @param tag the tag of the image
   * @returns an url
   */
  makeImageUrl(itemId: string, type: string, tag?: string) {
    const tagParam = tag ? `&tag=${tag}` : '';
    return `${this.axios.getUri()}/Items/${itemId}/Images/${type}?api_key=${this.token
      }${tagParam}`;
  }

  /**
   * Makes an URL that takes the user to the page for a certain item on the server.
   *
   * @param itemId the item id
   * @returns an url
   */
  makeJellyfinItemUrl(itemId: string) {
    return `${this.axios.getUri()}/web/index.html#!/details?id=${itemId}&serverId=${this._serverId
      }`;
  }

  /**
   * Converts an item to an ISong
   *
   * @param item the item to convert
   * @param rating the rating of the song, this is because the rating isn't stored on the item
   * @returns an ISong
   */
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
    return `${this.axios.getUri()}/Audio/${itemId}/universal?ApiKey=${this._token
      }`;
  }

  private static _instance: JellyfinAPI | undefined;
}
