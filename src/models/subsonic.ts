import SubsonicAPI, { AlbumWithSongsID3, Child, SubsonicBaseResponse } from 'subsonic-api';
import { IBackend } from './backend';
import { ISong, IPlaylist, IAlbum, IArtist } from './interfaces';

export class SubSonic implements IBackend {
  constructor(
    private api: SubsonicAPI,
    private session: {
      id: string;
      isAdmin: boolean;
      name: string;
      subsonicSalt: string;
      subsonicToken: string;
      token: string;
      username: string;
    },
  ) { }

  async getAllSongs(): Promise<ISong[]> {
    const result = await this.api.search3({ query: '*', songCount: 5000, songOffset: 0, albumCount: 0, artistCount: 0 });
    return result.searchResult3?.song!.map((song) => this.toSong(song)) ?? [];
  }

  async getPlaylistItems(id: string): Promise<ISong[]> {
    const playlist = await this.api.getPlaylist({ id: id });
    return playlist.playlist?.entry?.map((song) => this.toSong(song)) ?? [];
  }

  async getPlaylists(): Promise<IPlaylist[]> {
    const playlists = await this.api.getPlaylists();
    return playlists.playlists.playlist?.map(x => {
      return {
        id: x.id,
        title: x.name,
        thumbnailUrl: this.makeUrl("getCoverArt.view", { id: x.id, size: "200" }),
      }
    }) ?? [];
  }

  async updateRating(song: ISong, newRating: number): Promise<void> {
    await this.api.setRating({ id: song.id, rating: newRating });
    song.rating = newRating;
    song.isFavorite = newRating === 5;
  }

  async getAlbum(id: string): Promise<IAlbum> {
    const album = await this.api.getAlbum({ id: id });
    return this.makeAlbum(album.album)
  }

  private makeAlbum(album: AlbumWithSongsID3): IAlbum {
    return {
      id: album.id,
      title: album.name,
      artist: album.artist ?? '',
      artistId: album.artistId ?? '',
      thumbnailUrl: this.makeUrl("getCoverArt.view", { id: album.id, size: "200" }),
      artistUrl: '',
      albumUrl: ''
    };
  }

  async getAlbumSongs(id: string): Promise<ISong[]> {
    const album = await this.api.getAlbum({ id: id });
    return album.album.song?.map((song) => this.toSong(song)) ?? [];
  }

  async getArtist(id: string): Promise<IArtist> {
    const artistResponse = await this.api.getArtist({ id: id });
    const artist = artistResponse.artist;

    return {
      id: artist.id,
      name: artist.name,
      thumbnailUrl: this.makeUrl("getCoverArt.view", { id: artist.id, size: "200" }),
      logoUrl: '',
      artistUrl: ''
    }
  }

  async getArtistAlbums(id: string): Promise<IAlbum[]> {
    const artistResponse = await this.api.getArtist({ id: id });
    return artistResponse.artist.album?.map((album) => this.makeAlbum(album)) ?? [];
  }

  makeUrl(method: string, params?: Record<string, unknown>) {
    let base = this.api.baseURL();
    if (!base.endsWith("rest/")) base += "rest/";
    base += method;

    const url = new URL(base);
    url.searchParams.set("v", "1.16.1");
    url.searchParams.set("c", "subsonic-api");
    url.searchParams.set("f", "json");
    url.searchParams.set("u", this.session.username);
    url.searchParams.set("t", this.session.subsonicToken);
    url.searchParams.set("s", this.session.subsonicSalt);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === "undefined" || value === null) continue;
        if (Array.isArray(value)) {
          for (const v of value) {
            url.searchParams.append(key, v.toString());
          }
        } else {
          url.searchParams.set(key, value.toString());
        }
      }
    }

    return url.toString();
  }

  static async tryConnect(server: string, username: string, password: string): Promise<SubSonic | undefined> {
    try {
      const connection = new SubsonicAPI({
        url: server,
        auth: {
          username: username,
          password: password,
        },
      });

      return new SubSonic(connection, await connection.navidromeSession());
    } catch (e) {
      return undefined;
    }
  }

  toSong(song: Child): ISong {
    return {
      id: song.id,
      title: song.title,
      album: song.album,
      albumId: song.albumId,
      artist: song.artist ?? '',
      artistId: song.artistId ?? '',
      url: this.makeUrl("stream.view", { id: song.id, format: "raw" }),
      thumbnailUrl: this.makeUrl("getCoverArt.view", { id: song.id, size: "200" }),
      isFavorite: song.userRating === 5,
      isLiked: false,
      rating: song.userRating ?? 0,
    }
  }
}
