<template>
  <div style="min-width: 100px" class="full-width bg-primary text-white">
    <div v-if="small" class="row no-wrap items-center q-pt-xs">
      <div class="col-auto q-px-sm">
        <q-avatar
          rounded
          size="70px"
          v-if="bookPlayer.currentSong.value?.thumbnailUrl"
        >
          <img :src="bookPlayer.currentSong.value?.thumbnailUrl" />
        </q-avatar>
        <q-avatar
          icon="music_note"
          size="70px"
          color="secondary"
          rounded
          v-else
        >
        </q-avatar>
        <!-- <img height="75" :src="bookPlayer.thumbnail.value" /> -->
      </div>
      <div class="col">
        <div class="row no-wrap q-px-sm">
          <q-slider
            :min="0"
            :max="sliderEnd"
            :disable="bookPlayer.state.value.isBusy"
            color="white"
            label-text-color="primary"
            label
            :label-value="toTime(sliderTime)"
            v-model="sliderTime"
          ></q-slider>
        </div>

        <div class="row justify-between items-start">
          <q-list class="full-width" v-if="bookPlayer.currentSong.value">
            <q-item class="q-pt-none q-pl-sm">
              <q-item-section class="text-white">
                <q-item-label>{{
                  bookPlayer.currentSong.value.title
                }}</q-item-label>
                <q-item-label caption lines="1" class="text-white"
                  >{{ bookPlayer.currentSong.value.artist }} -
                  {{ bookPlayer.currentSong.value.album }}</q-item-label
                >
              </q-item-section>
              <q-item-section side>
                <div class="row no-wrap items-center">
                  <div
                    class="row no-wrap items-center"
                    style="background-color: primary"
                  >
                    <q-slider
                      :min="0"
                      :max="100"
                      style="min-width: 100px"
                      thumb-size="5px"
                      color="secondary"
                      v-model="bookPlayer.state.value.volume"
                    />
                    <q-btn
                      v-ripple.stop
                      flat
                      round
                      color="white"
                      class="q-mx-xs"
                      :icon="
                        bookPlayer.state.value.volume > 0 &&
                        !bookPlayer.state.value.mute
                          ? 'volume_up'
                          : 'volume_off'
                      "
                      @click.stop.prevent="
                        bookPlayer.state.value.mute =
                          !bookPlayer.state.value.mute
                      "
                    />
                  </div>
                  <!-- <q-btn
                    v-ripple.stop
                    round
                    color="light-blue-10"
                    class="q-mx-xs"
                    icon="replay_30"
                    @click.stop.prevent="bookPlayer.player.seekRelative(-30)"
                    :disable="bookPlayer.state.value.isBusy"
                  /> -->
                  <q-btn
                    v-ripple.stop
                    flat
                    round
                    color="white"
                    class="q-mx-xs"
                    :disable="bookPlayer.state.value.isBusy"
                    icon="skip_previous"
                    :loading="bookPlayer.state.value.isBusy"
                    @click.stop.prevent="bookPlayer.player.skip_to_previous()"
                  />
                  <q-btn
                    v-ripple.stop
                    flat
                    round
                    color="white"
                    class="q-mx-xs"
                    :disable="bookPlayer.state.value.isBusy"
                    :icon="
                      !bookPlayer.state.value.isPlaying ? 'play_arrow' : 'pause'
                    "
                    :loading="bookPlayer.state.value.isBusy"
                    @click.stop.prevent="bookPlayer.player.playPause()"
                  />
                  <q-btn
                    v-ripple.stop
                    flat
                    round
                    color="white"
                    class="q-mx-xs"
                    :disable="bookPlayer.state.value.isBusy"
                    icon="skip_next"
                    :loading="bookPlayer.state.value.isBusy"
                    @click.stop.prevent="bookPlayer.player.skip_to_next()"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </div>
    <div v-else class="q-px-lg">
      <div
        style="text-align: center"
        class="q-mt-md"
        v-if="bookPlayer.currentSong.value"
      >
        <div style="font-size: 1.5em">
          {{ bookPlayer.currentSong.value.title }}
        </div>
        <div style="font-size: 1.2em">{{ '' }}&nbsp;</div>
      </div>
      <div class="row no-wrap items-center justify-center">
        <q-slider
          :min="0"
          :max="sliderEnd"
          :disable="bookPlayer.state.value.isBusy"
          color="white"
          label-text-color="primary"
          label
          :label-value="toTime(sliderTime)"
          v-model="sliderTime"
        ></q-slider>
      </div>
      <div class="row no-wrap items-center justify-between">
        <div class="q-ma-sm">{{ toTime(sliderTime) }}</div>
        <div class="q-ma-sm"></div>
        <div class="q-ma-sm">{{ toTime(sliderEnd) }}</div>
      </div>
      <div class="row no-wrap items-center justify-center full-width q-my-md">
        <q-btn
          round
          size="25px"
          color="light-blue-10"
          class="q-mx-xs"
          icon="skip_previous"
          :disable="bookPlayer.state.value.isBusy"
          @click="bookPlayer.player.skip_to_previous()"
        />
        <q-btn
          round
          size="30px"
          color="light-blue-10"
          class="q-mx-xs"
          :icon="!bookPlayer.state.value.isPlaying ? 'play_arrow' : 'pause'"
          :disable="bookPlayer.state.value.isBusy"
          @click="bookPlayer.player.playPause()"
          :loading="bookPlayer.state.value.isBusy"
        />
        <q-btn
          round
          size="25px"
          color="light-blue-10"
          class="q-mx-xs"
          icon="skip_next"
          :disable="bookPlayer.state.value.isBusy"
          @click="bookPlayer.player.skip_to_next()"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { injectBookPlayer } from 'src/models/bookplayer';
import { toTime } from 'src/models/helper';

function useAudioPlayerSlider() {
  const sliderStart = ref(0);
  const sliderEnd = ref(0);
  const bookPlayer = injectBookPlayer();

  watch(
    () => bookPlayer.state.value.duration,
    () => {
      sliderStart.value = 0;
      sliderEnd.value = bookPlayer.state.value.duration;
    }
  );

  const sliderTime = computed<number>({
    get: () => bookPlayer.state.value.position,
    set: async (v) => {
      await bookPlayer.player.seekAbsolute(v);
    },
  });

  return { sliderStart, sliderEnd, sliderTime, toTime };
}

export default defineComponent({
  name: 'BookPlayer',
  props: {
    small: {
      type: Boolean,
      required: false,
    },
  },
  setup() {
    const bookPlayer = injectBookPlayer();

    return {
      bookPlayer,
      ...useAudioPlayerSlider(),
    };
  },
});
</script>
