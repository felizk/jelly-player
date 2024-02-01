<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="menu" class="q-mr-sm">
          <q-menu>
            <q-list style="min-width: 200px">
              <q-item-label header>Favorite Ratio</q-item-label>
              <q-item>
                <q-item-section side>
                  <q-icon color="deep-orange" name="favorite" />
                </q-item-section>
                <q-item-section>
                  <q-slider
                    class="q-pr-sm"
                    :model-value="settings.favoriteRatio"
                    :min="5"
                    :max="95"
                    :step="5"
                    @change="
                      (val) => {
                        settings.favoriteRatio = val;
                      }
                    "
                    label
                    color="deep-orange"
                  />
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="signOut">
                <q-item-section>Sign out</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-toolbar-title> Jelly Player </q-toolbar-title>
        <q-input
          dark
          dense
          standout
          v-model="quickSearchText"
          input-class="text-right"
          class="q-ml-md"
          @keyup.esc="quickSearchText = ''"
          @keyup.enter="playSelectedSearchResult()"
          @keydown="keyPress"
          ref="searchBox"
        >
          <template v-slot:append>
            <q-icon v-if="quickSearchText === ''" name="search" />
            <q-icon
              v-else
              name="clear"
              class="cursor-pointer"
              @click="quickSearchText = ''"
            />
          </template>
        </q-input>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      side="right"
      @hide="quickSearchText = ''"
      @keyup.esc="quickSearchText = ''"
      @keydown="keyPress"
      tabindex="0"
      :overlay="false"
      :breakpoint="0"
    >
      <q-list>
        <q-item
          v-for="(song, index) in searchResults"
          :key="index"
          clickable
          :active="index == selectedSearchResult"
          active-class="my-menu-link"
          @click="playSong(song)"
        >
          <q-item-section top avatar class="q-ml-none">
            <q-avatar size="50px" rounded>
              <img :src="song.thumbnailUrl" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ song.title }}</q-item-label>
            <q-item-label caption lines="1">
              {{ song.artist }} - {{ song.album }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row">
              <q-btn
                color="primary"
                flat
                dense
                round
                :icon="song.isFavorite ? 'favorite' : 'favorite_border'"
                @click.stop="
                  JellyfinMusic.setFavorited(api, song, !song.isFavorite)
                "
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-footer :model-value="footerOpen">
      <book-player :small="true" />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { injectBookPlayer } from 'src/models/bookplayer';
import BookPlayer from 'components/BookPlayer.vue';
import fuzzysort from 'fuzzysort';
import { useSongLibrary } from 'src/stores/songlibrary';
import { ISong } from 'src/models/jellyitem';
import { JellyfinAPI, JellyfinMusic } from 'src/models/jellyfin';
import { useAuthStore } from 'src/stores/authStore';
import { useRouter } from 'vue-router';
import { useSettings } from 'src/stores/settingsStore';

const settings = useSettings();
let bookPlayer = injectBookPlayer();
let songLibrary = useSongLibrary();
const api = JellyfinAPI.instance;
const auth = useAuthStore();
const router = useRouter();
const quickSearchText = ref<string>('');
const leftDrawerOpen = ref(false);
const footerOpen = ref(false);
const searchResults = ref([] as ISong[]);
const selectedSearchResult = ref(0);
const searchBox = ref<HTMLInputElement>();

watch(bookPlayer.currentSong, (val) => {
  footerOpen.value = !!val;
});

watch(quickSearchText, (text) => {
  leftDrawerOpen.value = !!text;

  if (text) {
    const results = fuzzysort.go(text, songLibrary.songs, {
      keys: ['title', 'album', 'artist'],
      limit: 5,
    });
    searchResults.value = results.map((x) => x.obj);
  } else {
    searchResults.value = [];
  }
});

async function playSong(song: ISong) {
  await bookPlayer.rerollSongs(song);
  bookPlayer.player.skip_to_track(0);
  quickSearchText.value = '';
  searchResults.value = [];
  selectedSearchResult.value = 0;
}

function playSelectedSearchResult() {
  if (
    searchResults.value.length > 0 &&
    selectedSearchResult.value >= 0 &&
    selectedSearchResult.value < searchResults.value.length
  ) {
    playSong(searchResults.value[selectedSearchResult.value]);
  }
}

function keyPress(evt: KeyboardEvent) {
  if (evt.key == 'Enter') {
    playSelectedSearchResult();
  } else if (evt.key == 'ArrowDown') {
    selectedSearchResult.value = Math.min(
      selectedSearchResult.value + 1,
      searchResults.value.length - 1
    );
  } else if (evt.key == 'ArrowUp') {
    selectedSearchResult.value = Math.max(selectedSearchResult.value - 1, 0);
  }
}

function windowKey(evt: KeyboardEvent) {
  if (evt.key === '/') {
    searchBox.value?.focus();
  }
}

window.onkeyup = windowKey;

function signOut() {
  JellyfinAPI.instance = undefined;
  auth.reset();
  router.push('/login');
}
</script>

<style lang="sass">
.my-menu-link
  background: $light-blue-2
</style>
