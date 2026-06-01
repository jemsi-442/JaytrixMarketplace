import { DataTypes } from "sequelize";

const hasTable = async (queryInterface, tableName, transaction) => {
  const tables = await queryInterface.showAllTables({ transaction });
  return tables
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : entry.tableName || entry.table_name || Object.values(entry)[0]
    )
    .includes(tableName);
};

export const up = async ({ queryInterface, transaction }) => {
  if (await hasTable(queryInterface, "app_settings", transaction)) {
    return;
  }

  await queryInterface.createTable(
    "app_settings",
    {
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    { transaction }
  );
};

export default { up };
