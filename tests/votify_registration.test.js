import { test, expect } from "@playwright/test";
import validator from "validator";

function generateRandomEmail() {
  const randomString = Math.random().toString(36).substring(2, 15);
  return `test.${randomString}@example.com`;
}

async function fillRegistrationForm(page, email, password, confirmPassword) {
  await page.fill('[placeholder="name@gmail.com"]', email);
  await page.getByLabel("Heslo").fill(password);
  await page.getByLabel("Potvrzení hesla").fill(confirmPassword);
}

test.describe("User Registration Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("https://auth.votify.app/cs/sign-up?");
  });

  test.describe("Field Presence and Visibility", () => {
    test("should check presence and visibility of fields and labels", async ({
      page,
    }) => {
      await expect(page.getByText("E-mail")).toBeVisible();
      await expect(page.getByPlaceholder("name@gmail.com")).toBeVisible();

      await expect(page.getByText("Heslo")).toBeVisible();
      await expect(page.getByLabel("Heslo")).toBeVisible();

      await expect(page.getByText("Potvrzení hesla")).toBeVisible();
      await expect(page.getByLabel("Potvrzení hesla")).toBeVisible();

      await expect(
        page.getByRole("button", { name: "Registrace" })
      ).toBeVisible();
    });
  });

  test.describe("Email Validation", () => {
    const emailAddresses = [
      "valid@example.com",
      "invalid-email",
      "invalid@",
      "invalid@domain",
      "invalid@domain.",
      "invalid@domain..com",
      "invalid@domain,com",
      "invalid@ domain.com",
      "invalid@domain@domain.com",
    ];

    for (const email of emailAddresses) {
      test(`should validate email format for ${email}`, async ({ page }) => {
        await fillRegistrationForm(page, email, "", "");

        await page.getByRole("button", { name: "Registrace" }).click();

        if (!validator.isEmail(email)) {
          await expect(page.getByText("Nevalidní e-mail")).toBeVisible();
        } else {
          await expect(page.getByText("Nevalidní e-mail")).not.toBeVisible();
        }
      });
    }
  });

  test.describe("Password Validation", () => {
    test("should accept matching passwords", async ({ page }) => {
      const email = generateRandomEmail();
      const password = "TestPassword123";

      await fillRegistrationForm(page, email, password, password);

      await page.getByRole("button", { name: "Registrace" }).click();

      await expect(
        page.getByText("Kontrola hesla se neshoduje")
      ).not.toBeVisible();
    });

    test("should show error for non-matching passwords", async ({ page }) => {
      const email = generateRandomEmail();
      const password = "TestPassword123";
      const mismatchedPassword = "DifferentPassword123";

      await fillRegistrationForm(page, email, password, mismatchedPassword);

      await page.getByRole("button", { name: "Registrace" }).click();

      await expect(page.getByText("Kontrola hesla se neshoduje")).toBeVisible();
    });

    test("should accept passwords of at least 8 characters on blur", async ({
      page,
    }) => {
      const validPassword = "ValidPass123";

      await page.getByLabel("Heslo").fill(validPassword);

      await page.getByLabel("Heslo").blur();

      await expect(
        page.getByText("Musí obsahovat alespoň 8 znaků")
      ).not.toBeVisible();
    });

    test("should reject passwords shorter than 8 characters on blur", async ({
      page,
    }) => {
      const shortPassword = "Short1";

      await page.getByLabel("Heslo").fill(shortPassword);

      await page.getByLabel("Heslo").blur();

      await expect(
        page.getByText("Musí obsahovat alespoň 8 znaků")
      ).toBeVisible();
    });
  });

  test.describe("Form Submission", () => {
    test("should navigate to the correct page after registration", async ({
      page,
    }) => {
      const email = generateRandomEmail();
      const password = "ValidPass123";

      await fillRegistrationForm(page, email, password, password);

      await page.getByRole("button", { name: "Registrace" }).click();

      await page.waitForURL("**/successful-sign-up?email=*");

      const currentUrl = page.url();
      console.log("Current URL:", currentUrl);

      expect(currentUrl).toContain("successful-sign-up");
    });
  });
});
