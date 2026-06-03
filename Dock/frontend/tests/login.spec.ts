import { test, expect } from '@playwright/test';

test('login page renders correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await expect(page.getByText('Welcome back')).toBeVisible();

    await expect(
        page.getByPlaceholder('Username')
    ).toBeVisible();

    await expect(
        page.getByPlaceholder('Password')
    ).toBeVisible();

    await expect(
        page.getByRole('button', { name: 'Login' })
    ).toBeVisible();
});

test('user can login', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password').fill('bierislekker');

    await page.getByRole('button', { name: 'Login' }).click();

});

test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.getByPlaceholder('Username').fill('wrong');
    await page.getByPlaceholder('Password').fill('wrong');

    await page.getByRole('button', { name: 'Login' }).click();

    await expect(
        page.getByText(/invalid username or password/i)
    ).toBeVisible();
});
