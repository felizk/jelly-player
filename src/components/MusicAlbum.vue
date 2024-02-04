<!--
  This is the album view for music. It displays the album art, artist, and songs in the album.
  It also allows the user to play the songs in the album.

  This also has an example usage of skeleton loading.
-->

<template>
  <div class="q-pa-md" v-if="isBusy">
    <q-skeleton size="150px" />
    <q-item style="max-width: 300px">
      <q-item-section avatar>
        <q-skeleton type="QAvatar" />
      </q-item-section>

      <q-separator class="q-mb-lg" />

      <q-item-section>
        <q-item-label>
          <q-skeleton type="text" />
        </q-item-label>
        <q-item-label caption>
          <q-skeleton type="text" width="65%" />
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item style="max-width: 300px">
      <q-item-section avatar>
        <q-skeleton type="QAvatar" />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          <q-skeleton type="text" />
        </q-item-label>
        <q-item-label caption>
          <q-skeleton type="text" width="90%" />
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item style="max-width: 300px">
      <q-item-section avatar>
        <q-skeleton type="QAvatar" />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          <q-skeleton type="text" width="35%" />
        </q-item-label>
        <q-item-label caption>
          <q-skeleton type="text" />
        </q-item-label>
      </q-item-section>
    </q-item>
  </div>

  <div v-else>
    <div class="row justify-start">
      <q-avatar size="150px" class="q-mb-lg" rounded v-if="thumbnailUrl">
        <img :src="thumbnailUrl" />
      </q-avatar>
      <q-avatar
        class="text-white q-mb-lg"
        icon="music_note"
        size="150px"
        color="secondary"
        rounded
        v-else
      />

      <div>
        <h4 class="q-ma-lg items-center">
          {{ songs[0]?.album }}
          <q-btn
            round
            flat
            size="sm"
            icon="open_in_new"
            color="primary"
            :href="jellyfinUrl"
            target="_blank"
          />
        </h4>
        <h5 class="q-ma-lg">
          {{ songs[0]?.artist }}
          <q-btn
            round
            flat
            size="sm"
            icon="open_in_new"
            color="primary"
            :href="artistUrl"
            target="_blank"
          />
        </h5>
      </div>
    </div>
    <q-separator class="q-mb-lg" />
    <q-list>
      <song-item
        v-for="(song, index) in songs"
        :key="index"
        :song="song"
        :active="bookPlayer.currentSong.value == song"
        @playSong="playSong(index)"
        :showRating="true"
      >
      </song-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { injectBookPlayer } from 'src/models/bookplayer';
import { ref, watch } from 'vue';
import { JellyfinAPI } from 'src/models/jellyfin';
import { IArtistItem, IBaseItem, ISong } from 'src/models/jellyitem';
import { useSongLibrary } from 'src/stores/songlibrary';
import SongItem from 'src/components/SongItem.vue';

export interface MusicAlbumProps {
  albumId: string;
}

const props = defineProps<MusicAlbumProps>();

const api = JellyfinAPI.instance;
const songLibrary = useSongLibrary();
const bookPlayer = injectBookPlayer();
const isBusy = ref(true);

const songs = ref<ISong[]>([]);
const thumbnailUrl = ref<string>('');
const jellyfinUrl = ref<string>('');
const artistUrl = ref<string>('');

async function playSong(songIndex: number) {
  await bookPlayer.updatePlaylist(songs.value, false);
  await bookPlayer.player.skip_to_track(songIndex);
}

const emit = defineEmits<{
  (e: 'albumLoaded', artist: IArtistItem, albumName: string): void;
}>();

async function loadAlbum() {
  try {
    isBusy.value = true;
    const albumData = (await api.getAlbumAndSongs(
      props.albumId as string
    )) as IBaseItem & { Children: IBaseItem[] };

    emit('albumLoaded', albumData.ArtistItems[0], albumData.Name ?? '');

    songs.value = albumData.Children.map((x: IBaseItem) =>
      songLibrary.lookup.get(x.Id)
    ).filter((x) => x) as ISong[];

    thumbnailUrl.value = albumData.ImageTags.Primary
      ? api.makePrimaryImageUrl(albumData)
      : '';

    jellyfinUrl.value = api.makeJellyfinItemUrl(albumData.Id);
    artistUrl.value = api.makeJellyfinItemUrl(albumData.ArtistItems[0].Id);

    // bookPlayer.setPlaylist(album.Songs);
  } catch (e) {
    console.error(e);
  } finally {
    isBusy.value = false;
  }
}

watch(
  () => props.albumId,
  async () => {
    await loadAlbum();
  }
);

loadAlbum();
</script>
