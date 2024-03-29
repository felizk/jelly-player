# Jelly Player (jellyplayer)

This is my toy app of a music player that connects to a Jellyfin Server.

I created it because I wanted to be able to control the "recommendation algorithm" to use; and of course for fun.

I hope it can be useful for someone else who wants to play with the Jellyfin API. Or someone who wants to make a Quasar App.

Quasar & Vue was chosen because it's what I know and like.

Shoutout to James Harvey from [finamp](https://github.com/jmshrv/finamp) for the nice blog post that got me started: https://jmshrv.com/posts/jellyfin-api/

## Features to take inspiration from
 * Has a login page with navigation guards on the route. (bumps you back to the login screen if not authenticated)
 * Jellyfin API Access patterns
 * How to get the pictures for the songs, albums and artists
 * An audio player that sticks around while navigating the UI
 * A silly little randomization algorithm for picking songs making sure to fill the playlist with a certain ratio of favorite songs.
 * Uses a nice little search algorithm '[fuzzysort](https://github.com/farzher/fuzzysort)' for quick lookup
 * How to link to items in the Jellyfin UI
 * A sneaky way to support ratings. I really should fork jellyfin and contribute a way to add user rating through API. 



## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```


### Lint the files
```bash
yarn lint
# or
npm run lint
```


### Format the files
```bash
yarn format
# or
npm run format
```



### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
