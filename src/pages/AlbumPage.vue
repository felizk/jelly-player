<template>
  <q-page class="row items-top justify-evenly">
    <load-spinner v-if="isBusy" />
    <div v-else class="col-xs-12 col-sm-8">
      <q-breadcrumbs class="q-my-lg">
        <q-breadcrumbs-el label="Home" icon="home" to="/" />
        <q-breadcrumbs-el
          v-if="songs[0]?.artist"
          :label="songs[0]?.artist"
          icon="groups"
        />
        <q-breadcrumbs-el :label="songs[0]?.album" icon="music_note" />
      </q-breadcrumbs>

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
              icon="open_in_new"
              color="primary"
              class="q-mx-sm"
              :href="jellyfinUrl"
              target="_blank"
            />
          </h4>
          <h5 class="q-ma-lg">{{ songs[0]?.artist }}</h5>
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
  </q-page>
</template>

<script setup lang="ts">
import { injectBookPlayer } from 'src/models/bookplayer';
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';
import LoadSpinner from 'src/components/LoadSpinner.vue';
import { JellyfinAPI, JellyfinMusic } from 'src/models/jellyfin';
import { IBaseItem, ISong } from 'src/models/jellyitem';
import { useSongLibrary } from 'src/stores/songlibrary';
import SongItem from 'src/components/SongItem.vue';

const route = useRoute();
const id = route.params.albumId;
const songLibrary = useSongLibrary();

let bookPlayer = injectBookPlayer();

async function playSong(songIndex: number) {
  await bookPlayer.updatePlaylist(songs.value, false);
  await bookPlayer.player.skip_to_track(songIndex);
}

const isBusy = ref(true);
const api = JellyfinAPI.instance;

const songs = ref<ISong[]>([]);
const thumbnailUrl = ref<string>('');
const jellyfinUrl = ref<string>('');

async function loadAlbum() {
  try {
    isBusy.value = true;
    const albumData = (await JellyfinMusic.getAlbum(
      api,
      id as string
    )) as IBaseItem & { Children: IBaseItem[] };

    songs.value = albumData.Children.map((x: IBaseItem) =>
      songLibrary.lookup.get(x.Id)
    ).filter((x: any) => x) as ISong[];

    thumbnailUrl.value = albumData.ImageTags.Primary
      ? `${api?.axios.getUri()}/Items/${albumData.Id}/Images/Primary?ApiKey=${
          api?.token
        }&tag=${albumData.ImageTags.Primary}`
      : '';

    jellyfinUrl.value = `${api?.axios.getUri()}/web/index.html#!/details?id=${
      albumData.Id
    }&serverId=${albumData.ServerId}`;

    // bookPlayer.setPlaylist(album.Songs);
  } catch (e) {
    console.error(e);
  } finally {
    isBusy.value = false;
  }
}

loadAlbum();
watch(
  () => route.params.albumId,
  async (newId) => {
    await loadAlbum();
  }
);
</script>
