import { Schema } from 'mongoose'

export const UserSchema = new Schema({
  username: {         // name for Personal and Businness name for Business
    type: String,
    required: true,
    minLength: [3, "Username must be at least 3 characters"],
    maxLength: [30, "Username must be at most 30 characters"]
  },
  displayname: {
    type: String,
    minLength: [3, "Username must be at least 3 characters"],
    maxLength: [30, "Username must be at most 30 characters"]
  },
  profileImg: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },

  // Si el usuario se registra con Google, password puede ser null
  password: {
    type: String,
    required: function () {
      return this.authProvider === 'local'
    }
  },

  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },

  googleId: {
    type: String,
    required: function () {
      return this.authProvider === 'google'
    },
    unique: true,
    sparse: true,
  },

  bio: {
    type: String,
    required: false
  },
  country: {
    type: String,
    required: false
  },
  products: [{
    type: Schema.Types.ObjectId,
    ref: 'Product'
  }],
  services: [{
    type: Schema.Types.ObjectId,
    ref: 'Service'
  }],
  followers: [String],
  following: [String],
  cart: [{
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  }],

  // Dirección de envío del cliente
  shippingInfo: {
    completeName: String,
    document: Number,
    country: String,
    address: String,
    city: String,
    state: String,
    postalCode: String,
    phoneNumber: Number
  },
  // Dirección de recogida/envío del vendedor (solo si es negocio)
  pickupAddress: {
    contactName: String,
    phoneNumber: String,
    country: String,
    state: String,
    city: String,
    postalCode: String,
    address: String
  },

  // Transportadoras aceptadas por el vendedor
  carriersAllowed: [], // Ej: ['envia', 'interrapidisimo']

  // Orders
  orders: [{
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }],
  // Shopping
  shopping: [{
    type: Schema.Types.ObjectId,
    ref: 'Order'
  }],
  // Legal information
  legalname: {
    type: String
  },
  legallastname: {
    type: String
  },
  taxid: {
    type: String
  },
  accountType: {
    type: String,
    enum: ['personal', 'business'],
    required: true
  },
  // Wallet
  walletId: {
    type: Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  paypalAccount: {
    type: String,
    required: false
  },
  paypalWithdrawals: [],
  createAt: {
    type: Date,
    default: Date.now
  },
  // Notifications
  notifications: [
    {
      type: { type: String, required: true },
      message: { type: String, required: true },
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      read: {
        type: Boolean,
        default: false
      }
    }
  ],

  // Marketing services integration
  marketing: {
    google: {
      clientId: String,
      refreshToken: String,
      accessToken: String, // opcional si quieres cachearlo
      tokenExpiry: Date,    // fecha de expiración del access_token si lo almacenas
      accountId: String,    // ID de la cuenta de Google Ads
      customerId: String,   // ID del cliente de Google Ads
      campaigns: [          // campañas creadas desde Jenno (opcional)
        {
          campaignId: String,
          name: String,
          status: String,
          createdAt: Date
        }
      ]
    },
    meta: {
      businessId: String,
      accessToken: String,
      refreshToken: String,   // si Meta lo requiere (en algunos casos lo usa)
      adAccountId: String,
      pageId: String,
      instagramId: String,
      campaigns: [            // campañas creadas desde Jenno (opcional)
        {
          campaignId: String,
          name: String,
          status: String,
          createdAt: Date
        }
      ]
    }
  }

})
