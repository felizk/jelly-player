export interface IArtistItem {
  Name: string;
  Id: string;
}

export interface IItemUserData {
  IsFavorite: boolean;
  Likes: boolean;
}

export interface IBaseItem {
  Id: string;
  ServerId: string;
  Name: string;
  Album?: string;
  AlbumId?: string;
  AlbumArtist?: string;
  AlbumPrimaryImageTag?: string;
  ImageTags: { Primary?: string; Logo?: string };
  MediaType: string;
  Type: string;
  ArtistItems: IArtistItem[];
  AlbumArtists: IArtistItem[];
  UserData: IItemUserData;
  Path?: string;
}

export interface IUser {
  Id: string;
  Name: string;
  PrimaryImageTag: string;
  HasPassword: boolean;
}

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
