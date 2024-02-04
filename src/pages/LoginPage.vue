<!-- Login page -->

<template>
  <div class="fullscreen text-center q-pa-md flex flex-center">
    <!-- If we're loading something then show the spinner -->
    <load-spinner v-if="isBusy" />
    <div v-else>
      <h3>Jelly Player</h3>

      <!-- We first have to connect to the server, then we can show users. -->
      <q-form @submit="connectToServer" class="q-gutter-md q-my-lg">
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

      <!-- List all the public users. -->
      <div class="row q-gutter-md items-center justify-center">
        <div class="column text-center" v-for="user in users" :key="user.Id">
          <q-btn flat class="q-pa-none" @click="clickUserProfile(user)">
            <q-avatar
              rounded
              size="75px"
              icon="person"
              color="primary"
              text-color="white"
            />
          </q-btn>
          {{ user.Name }}
        </div>
      </div>

      <!-- Also have a form for private users and to put in the password. -->
      <q-form @submit="login" class="q-gutter-md q-my-lg" v-if="connected">
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
import { JellyfinAPI, JellyfinConnection } from 'src/models/jellyfin';
import { IUser } from 'src/models/jellyitem';
import { useAuthStore } from 'src/stores/authStore';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import LoadSpinner from 'src/components/LoadSpinner.vue';

const router = useRouter();
const auth = useAuthStore();

const server = ref(auth.server);
const token = ref(auth.token);
const user = ref();
const users = ref<IUser[]>([]);
const pw = ref('');
const connected = ref(false);
const connectError = ref(false);
const pwField = ref<HTMLInputElement | undefined>();
const isBusy = ref(!!server.value && !!token.value);
let connection: JellyfinConnection | undefined;

// Reset everything if the user changes the server
watch(server, () => {
  connected.value = false;
  users.value = [];
});

function clickUserProfile(selectedUser: IUser) {
  user.value = selectedUser.Name;
  pw.value = '';

  // We can go straight to submit if the user doesn't have a pw.
  if (!selectedUser.HasPassword) {
    void login();
  } else if (pwField.value) {
    pwField.value.focus();
  }
}

// Connect to the server and get the users.
async function connectToServer() {
  try {
    isBusy.value = true;

    // Prepend http if it's missing.
    if (!URL.canParse(server.value)) {
      const httpVersion = `http://${server.value}`;
      if (URL.canParse(httpVersion)) {
        server.value = httpVersion;
      }
    }

    // This function actually throws if the URL is invalid.
    const url = new URL(server.value);
    if (!url.port) {
      url.port = '8096';
      server.value = url.toString();
    }

    // Remove trailing slashes
    while (server.value.endsWith('/')) {
      server.value = server.value.substring(0, server.value.length - 1);
    }

    connection = JellyfinConnection.create(server.value);

    users.value = await connection.getPublicUsers();

    connected.value = true;

    // Save the server in the browser
    auth.server = server.value;
  } finally {
    isBusy.value = false;
  }
}

async function login() {
  try {
    isBusy.value = true;
    if (!connection) return;

    JellyfinAPI.setInstance(
      await connection.authenticate(user.value, pw.value)
    );

    if (!JellyfinAPI.instance) return;

    auth.token = JellyfinAPI.instance.token;
    await router.push('/');
  } finally {
    isBusy.value = false;
  }
}

if (server.value) {
  connectToServer();
}
</script>
