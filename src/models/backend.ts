import { IAlbum, IArtist, IPlaylist, ISong } from './interfaces';

export interface IBackend {
    getAllSongs(): ISong[] | PromiseLike<ISong[]>;
    getPlaylistItems(id: string): Promise<ISong[]>;
    getPlaylists(): Promise<IPlaylist[]>;
    updateRating(song: ISong, newRating: number): Promise<void>;
    scrobble(song: ISong): Promise<void>;
    getAlbum(id: string): Promise<IAlbum>;
    getAlbumSongs(id: string): Promise<ISong[]>;
    getArtist(id: string): Promise<IArtist>;
    getArtistAlbums(id: string): Promise<IAlbum[]>;
}

export class Backend {
    static get instance() {
        return this._instance as IBackend;
    }

    static setInstance(val: IBackend | undefined) {
        this._instance = val;
    }

    static _instance?: IBackend;
}