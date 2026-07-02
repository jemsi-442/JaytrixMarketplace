export const up = async ({ sequelize, transaction }) => {
  await sequelize.query(
    `
      ALTER TABLE audit_logs
      ALTER COLUMN type TYPE VARCHAR(30);
    `,
    { transaction }
  );
};

export default { up };
