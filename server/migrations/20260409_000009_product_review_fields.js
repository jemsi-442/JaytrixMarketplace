import { DataTypes } from "sequelize";

const hasProductsTable = async (queryInterface, transaction) => {
  const tables = await queryInterface.showAllTables({ transaction });
  return tables
    .map((entry) =>
      typeof entry === "string"
        ? entry
        : entry.tableName || entry.table_name || Object.values(entry)[0]
    )
    .includes("products");
};

const getColumnMap = async (queryInterface, transaction) => {
  if (!(await hasProductsTable(queryInterface, transaction))) {
    return null;
  }

  return queryInterface.describeTable("products", { transaction });
};

export const up = async ({ queryInterface, transaction }) => {
  const columns = await getColumnMap(queryInterface, transaction);
  if (!columns) {
    return;
  }

  if (!columns.reviewed_at) {
    await queryInterface.addColumn(
      "products",
      "reviewed_at",
      { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      { transaction }
    );
  }

  if (!columns.reviewed_by) {
    await queryInterface.addColumn(
      "products",
      "reviewed_by",
      { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
      { transaction }
    );
  }

  if (!columns.review_notes) {
    await queryInterface.addColumn(
      "products",
      "review_notes",
      { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      { transaction }
    );
  }
};

export default { up };
