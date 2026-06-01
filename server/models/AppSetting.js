import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const AppSetting = sequelize.define(
  "AppSetting",
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: "app_settings",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default AppSetting;
