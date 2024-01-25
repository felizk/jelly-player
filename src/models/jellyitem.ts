export interface IArtistItem {
  Name: string;
  Id: string;
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
}

export function songFromItem(
  item: IBaseItem,
  baseUrl: string,
  apiToken: string
): ISong {
  let imageItem: string | undefined;

  if (item.ImageTags.Primary) {
    imageItem = item.AlbumId;
  } else if (item.AlbumPrimaryImageTag) {
    imageItem = item.AlbumId;
  } else {
    imageItem = item.ArtistItems[0]?.Id;
  }

  return {
    id: item.Id,
    title: item.Name,
    album: item.Album,
    albumId: item.AlbumId,
    artist: item.ArtistItems[0].Name,
    artistId: item.ArtistItems[0].Id,
    url: `${baseUrl}/Audio/${item.Id}/universal?ApiKey=${apiToken}`,
    thumbnailUrl: `${baseUrl}/Items/${imageItem}/Images/Primary?ApiKey=${apiToken}`,
  };
}
