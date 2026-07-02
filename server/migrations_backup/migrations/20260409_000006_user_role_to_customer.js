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

export const up = async ({ sequelize, transaction }) => {
  await sequelize.query(
    `
      ALTER TABLE users
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20)
    `,
    { transaction }
  );
};

export default { up };
