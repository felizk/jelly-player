<template>
  <div style="min-width: 100px" class="full-width bg-primary text-white">
    <div class="row no-wrap items-center q-pt-xs">
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
  setup() {
    const bookPlayer = injectBookPlayer();

    return {
      bookPlayer,
      ...useAudioPlayerSlider(),
    };
  },
});
</script>
