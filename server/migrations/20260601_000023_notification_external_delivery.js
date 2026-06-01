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

const hasColumn = async (queryInterface, tableName, columnName, transaction) => {
  const columns = await queryInterface.describeTable(tableName, { transaction });
  return Boolean(columns[columnName]);
};

export const up = async ({ queryInterface, transaction }) => {
  if (!(await hasTable(queryInterface, "notifications", transaction))) {
    return;
  }

  const columns = [
    ["external_channel", { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ["external_status", { type: DataTypes.STRING, allowNull: true, defaultValue: null }],
    ["external_sent_at", { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
    ["external_error", { type: DataTypes.TEXT, allowNull: true, defaultValue: null }],
  ];

  for (const [name, definition] of columns) {
    if (!(await hasColumn(queryInterface, "notifications", name, transaction))) {
      await queryInterface.addColumn("notifications", name, definition, { transaction });
    }
  }
};

export default { up };
