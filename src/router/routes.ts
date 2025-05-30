import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    meta: { requiresAuth: true },
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path: 'Album/:albumId',
        component: () => import('pages/AlbumPage.vue'),
      },
      {
        path: 'Artist/:id',
        component: () => import('pages/ArtistPage.vue'),
      },
      {
        path: 'Playlists',
        component: () => import('pages/PlaylistsPage.vue'),
      },
    ],
  },
  {
    path: '/login',
    meta: { requiresAuth: false },
    component: () => import('pages/LoginPage.vue'),
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
