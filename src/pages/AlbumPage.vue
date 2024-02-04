<template>
  <q-page class="row items-top justify-evenly">
    <div class="col-xs-12 col-sm-8">
      <q-breadcrumbs class="q-my-lg">
        <q-breadcrumbs-el label="Home" icon="home" to="/" />
        <q-breadcrumbs-el
          v-if="artist"
          :label="artist.Name"
          icon="groups"
          :to="`/Artist/${artist.Id}`"
        />
        <q-breadcrumbs-el
          v-if="albumName"
          :label="albumName"
          icon="music_note"
        />
      </q-breadcrumbs>

      <MusicAlbum
        :albumId="id"
        @albumLoaded="
          (newArtist, album) => {
            albumName = album;
            artist = newArtist;
          }
        "
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';
import MusicAlbum from 'src/components/MusicAlbum.vue';
import { IArtistItem } from 'src/models/jellyitem';

const route = useRoute();
const id = ref<string>(route.params.albumId as string);
const albumName = ref('');
const artist = ref<IArtistItem | undefined>(undefined);

watch(
  () => route.params.albumId,
  async (newId) => {
    id.value = newId as string;
  }
);
</script>
