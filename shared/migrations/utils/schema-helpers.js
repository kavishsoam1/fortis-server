/**
 * Helper functions for managing schemas in migrations
 */

/**
 * Create a schema if it doesn't exist
 * @param {Object} queryInterface - Sequelize queryInterface
 * @param {string} schemaName - Name of the schema to create
 */
async function createSchema(queryInterface, schemaName) {
  await queryInterface.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
}

/**
 * Drop a schema if it exists
 * @param {Object} queryInterface - Sequelize queryInterface
 * @param {string} schemaName - Name of the schema to drop
 * @param {boolean} cascade - Whether to cascade the drop operation
 */
async function dropSchema(queryInterface, schemaName, cascade = true) {
  await queryInterface.sequelize.query(
    `DROP SCHEMA IF EXISTS ${schemaName} ${cascade ? 'CASCADE' : ''}`
  );
}

/**
 * Create a table in a specific schema
 * @param {Object} queryInterface - Sequelize queryInterface
 * @param {string} tableName - Name of the table without schema prefix
 * @param {string} schemaName - Name of the schema
 * @param {Object} attributes - Table attributes/columns definition
 * @param {Object} options - Additional options for createTable
 */
async function createTableInSchema(queryInterface, tableName, schemaName, attributes, options = {}) {
  const fullTableName = { tableName, schema: schemaName };
  return queryInterface.createTable(fullTableName, attributes, options);
}

/**
 * Drop a table from a specific schema
 * @param {Object} queryInterface - Sequelize queryInterface
 * @param {string} tableName - Name of the table without schema prefix
 * @param {string} schemaName - Name of the schema
 * @param {Object} options - Additional options for dropTable
 */
async function dropTableInSchema(queryInterface, tableName, schemaName, options = {}) {
  const fullTableName = { tableName, schema: schemaName };
  return queryInterface.dropTable(fullTableName, options);
}

/**
 * Add a column to a table in a specific schema
 * @param {Object} queryInterface - Sequelize queryInterface
 * @param {string} tableName - Name of the table without schema prefix
 * @param {string} schemaName - Name of the schema
 * @param {string} columnName - Name of the column to add
 * @param {Object} attributeDefinition - Column definition
 */
async function addColumnToSchema(queryInterface, tableName, schemaName, columnName, attributeDefinition) {
  const fullTableName = { tableName, schema: schemaName };
  return queryInterface.addColumn(fullTableName, columnName, attributeDefinition);
}

/**
 * Remove a column from a table in a specific schema
 * @param {Object} queryInterface - Sequelize queryInterface
 * @param {string} tableName - Name of the table without schema prefix
 * @param {string} schemaName - Name of the schema
 * @param {string} columnName - Name of the column to remove
 */
async function removeColumnFromSchema(queryInterface, tableName, schemaName, columnName) {
  const fullTableName = { tableName, schema: schemaName };
  return queryInterface.removeColumn(fullTableName, columnName);
}

module.exports = {
  createSchema,
  dropSchema,
  createTableInSchema,
  dropTableInSchema,
  addColumnToSchema,
  removeColumnFromSchema
};
