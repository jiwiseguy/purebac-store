import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { PRODUCT_METADATA_MODULE } from './src/modules/product-metadata'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Optional providers — only wired in when their credentials are present so
// local development works without cloud services configured.
const hasR2 = !!process.env.R2_BUCKET && !!process.env.R2_ACCESS_KEY_ID
const hasResend = !!process.env.RESEND_API_KEY
const hasPaypal = !!process.env.PAYPAL_CLIENT_ID && !!process.env.PAYPAL_CLIENT_SECRET

const paymentProviders: any[] = [
  {
    resolve: "./src/providers/zelle-payment",
    id: "zelle",
    options: {},
  },
]

if (hasPaypal) {
  paymentProviders.push({
    resolve: "./src/providers/paypal-payment",
    id: "paypal",
    options: {
      client_id: process.env.PAYPAL_CLIENT_ID,
      client_secret: process.env.PAYPAL_CLIENT_SECRET,
      environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
    },
  })
}

const modules: any[] = [
  {
    resolve: "./src/modules/product-metadata",
    key: PRODUCT_METADATA_MODULE,
  },
  {
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: paymentProviders,
    },
  },
]

if (hasR2) {
  modules.push({
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/file-s3",
          id: "s3",
          options: {
            file_url: process.env.R2_PUBLIC_URL,
            access_key_id: process.env.R2_ACCESS_KEY_ID,
            secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
            region: "auto",
            bucket: process.env.R2_BUCKET,
            endpoint: process.env.R2_ENDPOINT,
          },
        },
      ],
    },
  })
}

if (hasResend) {
  modules.push({
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: [
        {
          resolve: "./src/providers/resend-notification",
          id: "resend",
          options: {
            api_key: process.env.RESEND_API_KEY,
            from: process.env.FROM_EMAIL,
            channels: ["email"],
          },
        },
      ],
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules,
})
