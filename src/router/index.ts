import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routes from './routes';
import { LocalStorage } from 'quasar';
import { Backend } from 'src/models/backend';
import { SubSonic } from 'src/models/subsonic';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to, from, next) => {
    if (!Backend.instance) {
      const server = LocalStorage.getItem<string>('login_server') ?? '';
      const token = LocalStorage.getItem<string>('login_token') ?? '';
      const pw = LocalStorage.getItem<string>('login_pw') ?? '';

      if (server && token) {
        // const connection = JellyfinConnection.create(server);
        // const reloginApi = await connection.authenticateWithToken(token);

        const connection = await SubSonic.tryConnect(server, token, pw);

        if (connection) {
          //JellyfinAPI.setInstance(reloginApi);
          Backend.setInstance(connection);
        }
      }
    }

    if (!Backend.instance && to.meta.requiresAuth) {
      // Redirect to the login page
      next('/login');
    } else {
      // Continue with the navigation
      next();
    }
  });

  return Router;
});
