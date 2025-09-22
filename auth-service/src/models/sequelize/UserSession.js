const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * User Session Model
 * @typedef {Object} UserSession
 * @property {number} session_id - Session ID
 * @property {string} user_id - User ID (UUID)
 * @property {string} refresh_token - Refresh token
 * @property {Date} expires_at - Expiration timestamp
 * @property {Date} created_at - Record creation timestamp
 */
const UserSession = sequelize.define('UserSession', {
  session_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'user_sessions',
  schema: 'auth',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = UserSession;
