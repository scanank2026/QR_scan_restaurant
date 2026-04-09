# Restaurant Admin Security Documentation

This document outlines the security measures implemented for the Restaurant Admin Panel and Customer Menu. These measures ensure data integrity, prevent unauthorized access, and protect business logic from manipulation.

---

## 1. Authentication & Role-Based Access Control (RBAC)

### Profiles & Roles
- **Roles**: `super_admin`, `restaurant_owner`, `staff`.
- **Signup Protection**: A database trigger (`tr_check_profile_insert`) forces all new signups to the `restaurant_owner` role. It prevents anyone from self-assigning the `super_admin` role during registration.
- **Role & Restaurant Integrity**: Users cannot change their own `role` or `restaurant_id`. Only a `super_admin` can modify these fields in the `profiles` table. A database trigger (`tr_protect_profile_fields`) enforces this at the database level, even against direct API calls.
- **Non-Recursive RLS**: We use a `SECURITY DEFINER` function (`get_auth_role()`) to check user roles in RLS policies. This prevents "infinite recursion" errors where a policy on the `profiles` table tries to query itself.
- **Global Registration Control**: Signups can be disabled globally via `system_settings`. A database trigger (`tr_check_profile_registration`) enforces this at the database level, preventing API-based signup bypasses.

---

## 2. Row Level Security (RLS) Policies

Every table in the database is protected by RLS to ensure users only see and modify data they own.

### Key Tables:
- **`restaurants`**: 
    - Owners can only view and update their own restaurant.
    - Sensitive fields (subscription tier, status, credits) are protected by a trigger and cannot be modified by owners.
    - Public access is restricted to active restaurants only.
- **`orders` & `order_items`**:
    - **Public Access**: Restricted to active table sessions. Customers can only view orders for their own table during an active session.
    - **Admin Access**: Owners and staff can only see orders belonging to their restaurant.
    - **Deletion**: Customers cannot delete order items. Only owners and staff can perform deletions.
- **`table_sessions`**:
    - **Public Access**: Restricted to `SELECT` and `INSERT` only.
    - **Manipulation Protection**: `UPDATE` and `DELETE` are blocked for public users, preventing session hijacking or DOS attacks on other tables.
- **`staff`**:
    - Only the restaurant owner can add, update, or delete staff members.
    - Staff members cannot delete themselves or other staff.
- **`menu_items` & `categories`**:
    - Public can only `SELECT` (view) items.
    - `INSERT`, `UPDATE`, `DELETE` are restricted to owners and managers.
- **`waiter_calls` & `feedbacks`**:
    - Public can only create calls or feedback if they have an active table session, preventing spam from outside the restaurant.
    - Waiter calls are strictly scoped to the table ID associated with the session.

---

## 3. Business Logic Integrity (Triggers)

We use database triggers to enforce rules that cannot be bypassed by the frontend.

### Pricing Protection
- **`tr_enforce_order_item_price`**: When an order is placed, the database ignores the price sent by the client. It fetches the official price from the `menu_items` table and forces it onto the order. This prevents "price hacking" via the browser console.
- **`tr_sync_order_total`**: Automatically recalculates the `total_amount` of an order whenever items are added or removed, ensuring accounting accuracy.

### Subscription & Trial Management
- **`tr_set_default_restaurant_values`**: Automatically assigns a 14-day free trial and the 'free' tier to every new restaurant.
- **`tr_check_restaurant_update`**: Blocks owners from upgrading their own subscription tier or adding credits. These actions must go through the Super Admin or a payment gateway.

---

## 4. Storage & Media Security

- **Bucket Isolation**: The `menu_items` storage bucket is protected by a policy that ensures owners can only upload/delete files in their own folder (named after their `restaurant_id`).
- **Public View**: Images are publicly readable but only if the correct path is known.

---

## 5. API & Server-Side Security

### Email Receipts (`/api/send-receipt`)
- **Session Verification**: The backend server verifies the user's Supabase session token for every request.
- **Authorization Check**: Before sending an email, the server checks if the authenticated user actually owns the order they are trying to send a receipt for. This prevents the server from being used as a spam relay.

---

## 6. Cleanup & Maintenance

The following temporary files were used during the security audit and have been documented here:
- `security_hardening_v1.sql` through `v7.sql`
- `super_admin_setup.sql`
- `restaurant_linking_fix.sql`

*Note: These files can be safely archived or deleted as their logic is now part of the live database schema.*
