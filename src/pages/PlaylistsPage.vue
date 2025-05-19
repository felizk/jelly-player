<template>
  <q-page class="row items-top justify-evenly">
    <div class="col-xs-12 col-sm-8">
      <q-list>
        <q-item clickable v-for="playlist in playlists" :key="playlist.id" @click="play(playlist)">
          <q-item-section top avatar class="q-ml-none">
            <q-avatar size="50px" rounded v-if="playlist.thumbnailUrl">
              <img :src="playlist.thumbnailUrl" />
            </q-avatar>
            <q-avatar class="text-white" icon="music_note" size="50px" color="secondary" rounded v-else>
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ playlist.title }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { injectBookPlayer } from 'src/models/bookplayer';
import { JellyfinAPI } from 'src/models/jellyfin';
import { IPlaylist, ISong } from 'src/models/jellyitem';
import { useSongLibrary } from 'src/stores/songlibrary';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const songLibrary = useSongLibrary();
const bookPlayer = injectBookPlayer();
const router = useRouter();

const playlists = ref<IPlaylist[]>([])
async function load() {
  playlists.value = await JellyfinAPI.instance.getPlaylists();
}

async function play(playlist: IPlaylist) {
  const items = await JellyfinAPI.instance.getPlaylistItems(playlist.id);
  const songs = items.map(x => songLibrary.lookup.get(x.Id)).filter(x => x) as ISong[];

  await bookPlayer.updatePlaylist(songs, false);
  await bookPlayer.player.skip_to_track(0);
  await router.push('/')
}

load();
</script>
