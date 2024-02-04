<template>
  <q-page class="row items-top justify-evenly">
    <load-spinner v-if="isBusy" />
    <div v-else class="col-xs-12 col-sm-8">
      <q-breadcrumbs class="q-my-lg">
        <q-breadcrumbs-el label="Home" icon="home" to="/" />
        <q-breadcrumbs-el v-if="artistName" :label="artistName" icon="groups" />
      </q-breadcrumbs>

      <div v-for="(albumId, index) in albumIds" :key="index">
        <MusicAlbum :albumId="albumId" class="q-mb-xl" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';
import LoadSpinner from 'src/components/LoadSpinner.vue';
import { JellyfinAPI, JellyfinMusic } from 'src/models/jellyfin';
import { IBaseItem } from 'src/models/jellyitem';
import MusicAlbum from 'src/components/MusicAlbum.vue';

const route = useRoute();
const id = route.params.id;

const isBusy = ref(true);
const api = JellyfinAPI.instance;

const thumbnailUrl = ref<string>('');
const jellyfinUrl = ref<string>('');
const artistName = ref<string>('');
const albumIds = ref<string[]>([]);

async function loadArtist() {
  try {
    isBusy.value = true;

    const artistData = (await JellyfinMusic.getArtistAlbums(
      api,
      id as string
    )) as IBaseItem & { Children: IBaseItem[] };

    albumIds.value = artistData.Children.sort((a, b) =>
      a.Name.localeCompare(b.Name)
    ).map((a) => a.Id);

    artistName.value = artistData.Name;

    thumbnailUrl.value = artistData.ImageTags.Primary
      ? `${api?.axios.getUri()}/Items/${artistData.Id}/Images/Primary?ApiKey=${
          api?.token
        }&tag=${artistData.ImageTags.Primary}`
      : '';

    jellyfinUrl.value = `${api?.axios.getUri()}/web/index.html#!/details?id=${
      artistData.Id
    }&serverId=${artistData.ServerId}`;
  } catch (e) {
    console.error(e);
  } finally {
    isBusy.value = false;
  }
}

loadArtist();
watch(
  () => route.params.id,
  async () => {
    await loadArtist();
  }
);
</script>
