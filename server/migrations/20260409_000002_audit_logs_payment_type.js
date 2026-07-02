export const up = async ({ sequelize, transaction }) => {
  await sequelize.query(
    `
      ALTER TABLE audit_logs
      ALTER COLUMN type TYPE VARCHAR(32) USING type::VARCHAR,
      ALTER COLUMN type SET NOT NULL
    `,
    { transaction }
  );
};

export default { up };
