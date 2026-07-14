import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("renders heading and date", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    // Tanggal dalam format Indonesia, misal "Senin, 14 Juli 2026"
    await expect(page.locator("text=/\\w+, \\d+ \\w+ \\d{4}/")).toBeVisible();
  });

  test("has sidebar navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Transaksi" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Anggaran", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tabungan", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hutang", exact: true })).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("navigates to transactions page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Transaksi" }).click();
    await expect(page).toHaveURL("/transactions");
    await expect(page.getByRole("heading", { name: /transaksi/i })).toBeVisible();
  });

  test("navigates to budgets page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Anggaran", exact: true }).click();
    await expect(page).toHaveURL("/budgets");
    await expect(page.getByRole("heading", { name: /anggaran/i })).toBeVisible();
  });

  test("navigates to savings page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Tabungan" }).click();
    await expect(page).toHaveURL("/savings");
    await expect(page.getByRole("heading", { name: /tabungan/i })).toBeVisible();
  });

  test("navigates to debts page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Hutang" }).click();
    await expect(page).toHaveURL("/debts");
    await expect(page.getByRole("heading", { name: /hutang|cicilan/i })).toBeVisible();
  });
});

test.describe("Header — User Switcher", () => {
  test("toggles between Suami and Istri", async ({ page }) => {
    await page.goto("/");

    // Default Suami
    const avatar = page.locator("text=Suami").first();
    await expect(avatar).toBeVisible();

    // Click Istri
    await page.getByRole("button", { name: "Istri" }).click();
    // Avatar should show 'I'
    await expect(page.locator("text=I").first()).toBeVisible();

    // Click Suami back
    await page.getByRole("button", { name: "Suami" }).click();
    await expect(page.locator("text=S").first()).toBeVisible();
  });
});

test.describe("Page Rendering", () => {
  test("transactions page has filter controls", async ({ page }) => {
    await page.goto("/transactions");
    // Should search for filter elements or table/cards
    await expect(page.getByPlaceholder("Cari transaksi...").first()).toBeVisible();
  });

  test("dashboard has summary cards", async ({ page }) => {
    await page.goto("/");
    // Summary cards typically show income/expense/balance
    const cards = page.locator("text=/pengeluaran|pemasukan|saldo/i");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
