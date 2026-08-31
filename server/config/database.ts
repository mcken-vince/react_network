import dotenv from "dotenv";
import type { Options } from "sequelize";

dotenv.config();

export type Env = "development" | "test" | "production";

const common: Options = {
  host: process.env.DB_HOST || "localhost",
  dialect: "postgres",
  logging: false,
};

const config: Record<Env, Options> = {
  development: {
    ...common,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "react_network",
    port: parseInt(process.env.DB_PORT || "5433", 10),
  },
  test: {
    ...common,
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME_TEST || "react_network_test",
    port: parseInt(process.env.DB_PORT || "5433", 10),
  },
  production: {
    ...common,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "5432", 10),
  },
};

export default config;
