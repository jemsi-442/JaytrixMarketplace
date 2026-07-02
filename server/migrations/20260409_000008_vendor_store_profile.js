const hasUsersTable = async (queryInterface, transaction) => {
  const tables = await queryInterface.showAllTables({ transaction });
  return tables
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : entry.tableName || entry.table_name || Object.values(entry)[0]
    )
    .includes("users");
};

const getColumnMap = async (queryInterface, transaction) => {
  if (!(await hasUsersTable(queryInterface, transaction))) {
    return null;
  }

  return queryInterface.describeTable("users", { transaction });
};

export const up = async ({ queryInterface, sequelize, transaction }) => {
  const columns = await getColumnMap(queryInterface, transaction);
  if (!columns) {
    return;
  }

  if (!columns.store_name) {
    await queryInterface.addColumn(
      "users",
      "store_name",
      {
        type: sequelize.Sequelize.DataTypes.STRING(120),
        allowNull: true,
        defaultValue: null,
      },
      { transaction }
    );
  }

  if (!columns.store_slug) {
    await queryInterface.addColumn(
      "users",
      "store_slug",
      {
        type: sequelize.Sequelize.DataTypes.STRING(80),
        allowNull: true,
        defaultValue: null,
        unique: true,
      },
      { transaction }
    );
  }

  if (!columns.business_phone) {
    await queryInterface.addColumn(
      "users",
      "business_phone",
      {
        type: sequelize.Sequelize.DataTypes.STRING(40),
        allowNull: true,
        defaultValue: null,
      },
      { transaction }
    );
  }

  if (!columns.business_description) {
    await queryInterface.addColumn(
      "users",
      "business_description",
      {
        type: sequelize.Sequelize.DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      { transaction }
    );
  }
};

export default { up };
