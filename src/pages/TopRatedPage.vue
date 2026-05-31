<template>
  <q-page class="row items-top justify-evenly">
    <div class="col-xs-12 col-sm-8">
      <q-list>
        <SongItem v-for="song in topRatedSongs" :key="song.id" :song="song" :active="false" :show-rating="true"
          @playSong="play(song)" />
      </q-list>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { injectBookPlayer } from 'src/models/bookplayer';
import { ISong } from 'src/models/interfaces';
import { useSongLibrary } from 'src/stores/songlibrary';
import { useRouter } from 'vue-router';
import SongItem from 'src/components/SongItem.vue';

const songLibrary = useSongLibrary();
const bookPlayer = injectBookPlayer();
const router = useRouter();

const topRatedSongs = computed(() =>
  songLibrary.songs
    .filter((s: ISong) => s.rating === 5)
    .sort((a: ISong, b: ISong) => b.playCount - a.playCount)
);

async function play(song: ISong) {
  await bookPlayer.rerollSongs(song);
  bookPlayer.player.skip_to_track(0);
  await router.push('/');
}
</script>
