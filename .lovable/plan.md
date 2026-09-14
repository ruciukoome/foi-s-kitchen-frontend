# Correct customer and admin routing

## What will change

1. Remove the timing gap that can reuse the previous account’s admin profile while a new Google session is loading.
2. Resolve admin access from the currently signed-in user only, and keep customers on the home page after sign-in.
3. Move admin roles into a dedicated protected role table. Customers will no longer be able to edit any admin flag through their profile.
4. Keep every admin page closed until the current account’s role check has completed.

## Database security update

Add a migration that:
- creates a protected `user_roles` table and `admin` role;
- copies the existing real admin assignment into that table;
- changes the existing `is_admin` helper to read the protected role table;
- limits customer profile updates to name, phone, address, and delivery method only.

## Verification

- Test a normal Google-authenticated customer: callback → home page; no admin links; direct admin URL is rejected.
- Test the existing admin: callback → Admin Orders; admin pages remain available.
- Confirm the project builds without errors.
