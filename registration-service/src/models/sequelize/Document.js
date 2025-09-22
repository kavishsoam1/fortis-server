const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../../shared/sequelize');

/**
 * Document Model - For storing registration-related documents
 * @typedef {Object} Document
 * @property {number} id - Document ID
 * @property {string} document_id - Document UUID
 * @property {string} registration_id - Registration ID (UUID)
 * @property {string} document_type - Type of document
 * @property {string} file_name - Original file name
 * @property {string} file_path - Path to stored file
 * @property {string} mime_type - MIME type
 * @property {number} file_size - File size in bytes
 * @property {string} status - Document status
 * @property {Date} created_at - Record creation timestamp
 * @property {Date} updated_at - Record last update timestamp
 */
const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  document_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true
  },
  registration_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  document_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['id_proof', 'address_proof', 'medical_license', 'certification', 'medical_record', 'other']]
    }
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected']]
    }
  },
  verification_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verified_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'documents',
  schema: 'registration',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Document;
