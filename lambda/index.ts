import DB from "./db";

export async function main(): Promise<{ body: string; statusCode: 200 }> {
  const db = new DB({
    host: process.env.DB_HOST || "",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "",
  });

  db.destroy();
  return {
    body: JSON.stringify({ message: "Hello world" }),
    statusCode: 200,
  };
}
