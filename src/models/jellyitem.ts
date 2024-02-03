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
  Name: string;
  Album?: string;
  AlbumId?: string;
  AlbumArtist?: string;
  AlbumPrimaryImageTag?: string;
  ImageTags: { Primary: string };
  MediaType: string;
  Type: string;
  ArtistItems: IArtistItem[];
  UserData: IItemUserData;
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

export function songFromItem(
  item: IBaseItem,
  baseUrl: string,
  apiToken: string,
  rating?: number
): ISong {
  let imageItem: string | undefined;
  let imageTag: string | undefined;

  if (item.ImageTags.Primary) {
    imageItem = item.Id;
    imageTag = item.ImageTags.Primary;
  } else if (item.AlbumPrimaryImageTag) {
    imageItem = item.AlbumId;
    imageTag = item.AlbumPrimaryImageTag;
  } else {
    imageItem = item.ArtistItems[0]?.Id;
  }

  if (imageTag) imageTag = `&tag=${imageTag}`;
  else imageTag = '';

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
    url: `${baseUrl}/Audio/${item.Id}/universal?ApiKey=${apiToken}`,
    thumbnailUrl: `${baseUrl}/Items/${imageItem}/Images/Primary?ApiKey=${apiToken}${imageTag}`,
    isFavorite: item.UserData.IsFavorite,
    isLiked: item.UserData.Likes,
    rating: rating ?? 0,
  };
}
