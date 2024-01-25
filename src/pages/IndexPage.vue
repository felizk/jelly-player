<template>
  <q-page class="row items-center justify-evenly">
    <example-component
      title="Example component"
      active
      :todos="todos"
      :meta="meta"
    ></example-component>
    <q-btn @click="play">test</q-btn>
  </q-page>
</template>

<script setup lang="ts">
import { Todo, Meta } from 'components/models';
import ExampleComponent from 'components/ExampleComponent.vue';
import { inject, ref } from 'vue';
import { api } from 'boot/axios';
import { injectBookPlayer } from 'src/models/bookplayer';
import { IBaseItem, songFromItem } from 'src/models/jellyitem';

const todos = ref<Todo[]>([
  {
    id: 1,
    content: 'ct1',
  },
  {
    id: 2,
    content: 'ct2',
  },
  {
    id: 3,
    content: 'ct3',
  },
  {
    id: 4,
    content: 'ct4',
  },
  {
    id: 5,
    content: 'ct5',
  },
]);
const meta = ref<Meta>({
  totalCount: 1200,
});
let bookPlayer = injectBookPlayer();

async function test() {
  let response = await api.post(
    '/Users/AuthenticateByName',
    {
      Username: 'felizk',
      Pw: '',
    },
    {
      headers: {
        'X-Emby-Authorization':
          'MediaBrowser Client="JellyPlayer", Device="JellyPlayer", DeviceId="JellyPlayer", Version="0.2", Token=""',
      },
    }
  );
  console.log(response);

  let userId = response.data.User.Id;
  let token = response.data['AccessToken'];
  api.defaults.headers.common[
    'X-Emby-Authorization'
  ] = `MediaBrowser Client="JellyPlayer", Device="JellyPlayer", DeviceId="JellyPlayer", Version="0.1", Token="${token}"`;

  let itemsResponse = await api.get(`/Users/${userId}/Items`, {
    params: {
      IncludeItemTypes: 'Audio',
      recursive: true,
    },
  });

  let items = itemsResponse.data.Items as IBaseItem[];
  let idx = (Math.random() * items.length) | 0;
  let item = items[idx];

  let song = songFromItem(item, api.getUri(), token);

  bookPlayer.loadSong(song);

  // audioPlayer.value.src =
  //     api.getUri() +
  //     `/Audio/${items.data.Items[idx].Id}/universal?ApiKey=${token}`;

  //let response = await api.get('/Users/Public');
}

function play() {
  test();

  //audioPlayer.value?.play();
}
</script>
