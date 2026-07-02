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

export const up = async ({ queryInterface, transaction }) => {
  if (!(await hasProductsTable(queryInterface, transaction))) {
    return;
  }

  await queryInterface.changeColumn(
    "products",
    "status",
    {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "approved",
    },
    { transaction }
  );

  await queryInterface.sequelize.query(
    "UPDATE products SET status = 'approved', approved_at = COALESCE(approved_at, NOW()), review_notes = COALESCE(review_notes, 'Auto-published after marketplace policy update') WHERE status = 'pending'",
    { transaction }
  );
};

export default { up };
