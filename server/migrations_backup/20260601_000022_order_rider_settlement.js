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
  if (!(await hasTable(queryInterface, "orders", transaction))) {
    return;
  }

  if (!(await hasColumn(queryInterface, "orders", "rider_paid_at", transaction))) {
    await queryInterface.addColumn(
      "orders",
      "rider_paid_at",
      {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      { transaction }
    );
  }

  if (!(await hasColumn(queryInterface, "orders", "rider_payment_note", transaction))) {
    await queryInterface.addColumn(
      "orders",
      "rider_payment_note",
      {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      { transaction }
    );
  }
};

export default { up };
