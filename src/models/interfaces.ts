export interface ISong {
    id: string;
    title: string;
    album?: string;
    albumId?: string;
    artist: string;
    artistId: string;
    url: string;
    thumbnailUrl: string;
    isFavorite: boolean;
    isLiked: boolean;
    rating: number;
}

export interface IRatingPlaylist {
    id: string;
    rating: number;
}

export interface IPlaylist {
    id: string;
    title: string;
    thumbnailUrl: string;
}

export interface IAlbum {
    id: string;
    title: string;
    artist: string;
    artistId: string;
    thumbnailUrl: string;
    artistUrl: string;
    albumUrl: string;
}

export interface IArtist {
    id: string;
    name: string;
    thumbnailUrl: string;
    logoUrl: string;
    artistUrl: string;
}