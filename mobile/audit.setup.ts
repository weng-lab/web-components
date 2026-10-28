import fs from "node:fs";
import { test as setup } from "@playwright/test";
import { AUDIT_DIR } from "./stories";

setup("clear the last audit", () => {
  fs.rmSync(AUDIT_DIR, { recursive: true, force: true });
});
