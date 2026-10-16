// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  telemetry: false,

  modules: [
    'nuxt-quasar-ui',
    '@pinia/nuxt'
  ],

  quasar: {
    plugins: ['Notify', 'Dialog', 'Loading'],
    config: {
      notify: {
        position: 'bottom-right',
        timeout: 3500,
        actions: [{ icon: 'close', color: 'white' }]
      }
    },
    extras: {
      fontIcons: ['material-icons']
    }
  },

  typescript: {
    strict: true
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    appTimezone: process.env.APP_TIMEZONE || 'America/Caracas',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    public: {
      appName: process.env.APP_NAME || 'CRUDBASE',
      appTimezone: process.env.APP_TIMEZONE || 'America/Caracas'
    }
  },

  future: {
    compatibilityVersion: 4
  },

  nitro: {},

  compatibilityDate: '2025-01-01'
})
