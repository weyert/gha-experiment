import { expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import Home from "../app/page";

test("Pages Router", () => {
  render(<Home />);
  const main = within(screen.getByRole("main"));
  expect(main.getByRole("heading", { level: 2, name: /Learn/i })).toBeDefined();

  expect(main.getByRole("img", { name: /Vercel Logo/i })).toBeDefined();
});
