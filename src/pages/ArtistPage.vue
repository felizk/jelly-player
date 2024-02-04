<!-- This is the page that shows an artist -->

<template>
  <q-page class="row items-top justify-evenly">
    <load-spinner v-if="isBusy" />
    <div v-else class="col-xs-12 col-sm-8">
      <q-breadcrumbs class="q-my-lg">
        <q-breadcrumbs-el label="Home" icon="home" to="/" />
        <q-breadcrumbs-el v-if="artistName" :label="artistName" icon="groups" />
      </q-breadcrumbs>

      <q-img
        v-if="logoUrl"
        :src="logoUrl"
        :alt="artistName"
        class="q-mb-lg"
        height="150px"
        fit="contain"
      />

      <div v-for="(albumId, index) in albumIds" :key="index">
        <MusicAlbum :albumId="albumId" class="q-mb-xl" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { IBaseItem } from 'src/models/jellyitem';
import { JellyfinAPI } from 'src/models/jellyfin';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import LoadSpinner from 'src/components/LoadSpinner.vue';
import MusicAlbum from 'src/components/MusicAlbum.vue';

const api = JellyfinAPI.instance;
const route = useRoute();
const id = route.params.id;

const isBusy = ref(true);
const logoUrl = ref<string>('');
const jellyfinUrl = ref<string>('');
const artistName = ref<string>('');
const albumIds = ref<string[]>([]);

async function loadArtist() {
  try {
    isBusy.value = true;

    const artistData = (await api.getArtistAlbums(
      id as string
    )) as IBaseItem & { Children: IBaseItem[] };

    // Sort the albums by name
    albumIds.value = artistData.Children.sort((a, b) =>
      a.Name.localeCompare(b.Name)
    ).map((a) => a.Id);

    artistName.value = artistData.Name;

    // Set thumbnail url
    logoUrl.value = artistData.ImageTags.Logo
      ? api.makeLogoImageUrl(artistData)
      : '';

    // Set external url to Jellyfin
    jellyfinUrl.value = api.makeJellyfinItemUrl(artistData.Id);
  } catch (e) {
    console.error(e);
  } finally {
    isBusy.value = false;
  }
}

// Kick off loading the artist right away.
loadArtist();

// We gotta watch the route and update if it changes to point to another album.
watch(
  () => route.params.id,
  async () => {
    await loadArtist();
  }
);
</script>
