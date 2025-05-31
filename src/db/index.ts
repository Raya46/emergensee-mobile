import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(
  "postgresql://emergensee-db_owner:npg_UnWLZ2Y4JljD@ep-steep-cherry-a16ixc7m-pooler.ap-southeast-1.aws.neon.tech/emergensee-db?sslmode=require"
);
export const db = drizzle({ client: sql });
