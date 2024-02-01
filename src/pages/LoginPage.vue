<template>
  <div class="fullscreen text-center q-pa-md flex flex-center">
    <div>
      <h3>Jelly Player</h3>
      <q-form @submit="onConnect" class="q-gutter-md q-my-lg">
        <q-input filled v-model="server" label="Server" />
        <span class="text-red" v-if="connectError">failed to connect</span>
        <div>
          <q-btn
            label="Connect"
            type="submit"
            color="primary"
            v-if="!connected"
          />
        </div>
      </q-form>
      <div class="row q-gutter-md items-center justify-center">
        <div class="column text-center" v-for="user in users" :key="user.Id">
          <q-btn flat class="q-pa-none" @click="selectUser(user)">
            <q-avatar
              rounded
              size="75px"
              icon="person"
              color="teal"
              text-color="white"
            />
          </q-btn>
          {{ user.Name }}
        </div>
      </div>

      <q-form @submit="onSubmit" class="q-gutter-md q-my-lg" v-if="connected">
        <q-input
          filled
          v-model="user"
          label="User"
          lazy-rules
          :rules="[(val) => (val && val.length > 0) || 'Please type something']"
        />

        <q-input
          filled
          type="password"
          v-model="pw"
          label="Password"
          ref="pwField"
        />

        <div>
          <q-btn label="Login" type="submit" color="primary" />
        </div>
      </q-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LocalStorage } from 'quasar';
import { injectBookPlayer } from 'src/models/bookplayer';
import {
  JellyfinAPI,
  JellyfinConnection,
  JellyfinMusic,
} from 'src/models/jellyfin';
import { IUser } from 'src/models/jellyitem';
import { useAuthStore } from 'src/stores/authStore';
import { useSongLibrary } from 'src/stores/songlibrary';
import { provide, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

// TODO: Clean up, add spinner, add logout

const router = useRouter();
const bookPlayer = injectBookPlayer();
const auth = useAuthStore();

const server = ref(auth.server);
const users = ref<IUser[]>([]);
const user = ref(auth.userName);
const pw = ref('');
const token = ref(auth.token);
const connected = ref(false);
const connectError = ref(false);
const pwField = ref<HTMLInputElement | undefined>();

let connection: JellyfinConnection | undefined;

watch(server, () => {
  connected.value = false;
  users.value = [];
});

function selectUser(selectedUser: IUser) {
  user.value = selectedUser.Name;
  pw.value = '';

  if (!selectedUser.HasPassword) {
    void onSubmit();
  } else if (pwField.value) {
    pwField.value.focus();
  }
}

async function onConnect() {
  // sanitize the ip
  if (!URL.canParse(server.value)) {
    const httpVersion = `http://${server.value}`;
    if (URL.canParse(httpVersion)) {
      server.value = httpVersion;
    }
  }

  const url = new URL(server.value);
  if (!url.port) {
    url.port = '8096';
    server.value = url.toString();
  }

  while (server.value.endsWith('/')) {
    server.value = server.value.substring(0, server.value.length - 1);
  }

  connection = new JellyfinConnection(
    'JellyPlayer',
    'MyDevice',
    'MyId',
    '0.0.1',
    server.value
  );

  if (token.value) {
    const reloginApi = await connection.authenticateWithToken(token.value);
    if (reloginApi) {
      JellyfinAPI.instance = reloginApi;
      navigate();
    }
  }

  users.value = await connection.getUsers();
  connected.value = true;
  auth.server = server.value;
}

async function onSubmit() {
  await login();
}

async function login() {
  if (!connection) return;
  JellyfinAPI.instance = await connection.authenticate(user.value, pw.value);
  navigate();
}

async function navigate() {
  if (!JellyfinAPI.instance) return;
  auth.token = JellyfinAPI.instance.token;

  const lib = useSongLibrary();
  lib.setSongs(await JellyfinMusic.getAllSongs(JellyfinAPI.instance));
  void bookPlayer.rerollSongs();
  router.push('/');
}

if (server.value) {
  onConnect();
}
</script>
