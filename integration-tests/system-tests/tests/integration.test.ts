/* eslint-disable notice/notice */

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

test.describe.configure({ mode: "parallel" });

test.beforeEach(async ({ page }) => {
  await page.goto("https://localhost:3000");
});

test.describe("New Todo", () => {
  test("should allow me to add todo items", async ({ page }) => {
    // create a new todo locator
    await page.screenshot({ path: "screenshot.png" });
    const newTodo = page.getByPlaceholder("What needs to be done?");
  });
});
