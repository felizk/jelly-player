<template>
  <q-item
    clickable
    :active="props.active"
    active-class="my-menu-link"
    @click="emit('playSong')"
  >
    <q-item-section top avatar class="q-ml-none">
      <q-avatar size="50px" rounded v-if="song.thumbnailUrl">
        <img :src="song.thumbnailUrl" />
      </q-avatar>
      <q-avatar
        class="text-white"
        icon="music_note"
        size="50px"
        color="secondary"
        rounded
        v-else
      >
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ song.title }}</q-item-label>
      <q-item-label caption lines="1">
        {{ song.artist }} - {{ song.album }}
      </q-item-label>
    </q-item-section>
    <q-item-section side v-if="props.showRating">
      <div class="row">
        <q-rating
          :model-value="song.rating"
          :max="5"
          size="sm"
          color="primary"
          icon="favorite_border"
          icon-selected="favorite"
          icon-half="favorite"
          @update:model-value="updateRating"
          @click.stop
        />
        <!--
          <q-btn
            color="primary"
            flat
            dense
            round
            :icon="song.isFavorite ? 'favorite' : 'favorite_border'"
            @click.stop="
              JellyfinMusic.setFavorited(api, song, !song.isFavorite)
            "
          /> -->
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { JellyfinAPI, JellyfinMusic } from 'src/models/jellyfin';
import { ISong } from 'src/models/jellyitem';

export interface SongItemProps {
  song: ISong;
  showRating?: boolean;
  active: boolean;
}

function updateRating(newRating: number) {
  JellyfinMusic.updateRating(JellyfinAPI.instance, props.song, newRating);
}

const props = defineProps<SongItemProps>();
const emit = defineEmits<{
  playSong: [];
}>();
</script>

<style lang="sass">
.my-menu-link
  background: $light-blue-2
</style>
