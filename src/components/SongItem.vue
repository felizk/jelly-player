<!-- This is the common control for displaying a song -->

<template>
  <!-- We use active to set the background color of the playing song. -->
  <q-item clickable :active="props.active" active-class="my-menu-link" @click="emit('playSong')">
    <q-item-section top avatar class="q-ml-none">
      <q-avatar size="50px" rounded v-if="song.thumbnailUrl">
        <img :src="song.thumbnailUrl" />
      </q-avatar>
      <q-avatar class="text-white" icon="music_note" size="50px" color="secondary" rounded v-else>
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ song.title }}</q-item-label>
      <q-item-label caption lines="1" class="gt-xs">
        <router-link class="hover-link" :to="`/Artist/${song.artistId}`" @click.stop>{{ song.artist }}</router-link>
        -
        <router-link class="hover-link" :to="`/Album/${song.albumId}`" @click.stop>{{ song.album }}</router-link>
      </q-item-label>
      <q-item-label caption lines="1" class="xs">
        {{ song.artist }}
        -
        {{ song.album }}
      </q-item-label>
    </q-item-section>

    <q-item-section side v-if="props.showRating">
      <div class="row">
        <q-rating :model-value="song.rating" :max="5" size="sm" color="primary" icon="favorite_border"
          icon-selected="favorite" icon-half="favorite" @update:model-value="updateRating" @click.stop class="gt-xs" />
        <q-rating :model-value="song.rating" :max="5" size="xs" color="primary" icon="favorite_border"
          icon-selected="favorite" icon-half="favorite" @update:model-value="updateRating" @click.stop class="xs" />
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { JellyfinAPI } from 'src/models/jellyfin';
import { ISong } from 'src/models/jellyitem';

export interface SongItemProps {
  song: ISong;
  showRating?: boolean;
  active: boolean;
}

const props = defineProps<SongItemProps>();

// What should happen when you click this song?
const emit = defineEmits<{
  playSong: [];
}>();

function updateRating(newRating: number) {
  JellyfinAPI.instance.updateRating(props.song, newRating);
}
</script>

<style lang="sass">
.my-menu-link
  background: $light-blue-2
</style>
