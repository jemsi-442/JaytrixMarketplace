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
  if (!(await hasTable(queryInterface, "vendor_payouts", transaction))) {
    await queryInterface.createTable(
      "vendor_payouts",
      {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
        vendor_id: { type: DataTypes.INTEGER, allowNull: false },
        order_id: { type: DataTypes.INTEGER, allowNull: false },
        amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
        status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "pending" },
        notes: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
        created_by: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
        processed_by: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
        paid_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
        created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      },
      { transaction }
    );

    await queryInterface.addIndex(
      "vendor_payouts",
      ["order_id", "vendor_id"],
      {
        name: "uniq_vendor_payouts_order_vendor",
        unique: true,
        transaction,
      }
    );

    await queryInterface.addIndex(
      "vendor_payouts",
      ["vendor_id", "status", "created_at"],
      {
        name: "idx_vendor_payouts_vendor_status_created",
        transaction,
      }
    );
  }
};

export default { up };
