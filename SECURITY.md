# Security

If you find a security problem on the SURGICISS LTD website, please email **surgiciss@gmail.com** with the subject "Security". Do not post details publicly until we have replied.

Please do not test with other people's accounts or data.

## How the site is protected

- Passwords are hashed with scrypt and a random salt; they are never stored or logged as text.
- Secrets (database, email, sign-in keys) live only in the server's environment settings. Nothing secret is sent to the browser.
- Every form is checked again on the server. Database queries use placeholders, so typed text can never change a query.
- Text shown on pages is escaped, and a content security policy stops scripts from anywhere else running.
- Changes made by a signed-in person need a CSRF token, and requests from other websites are refused.
- Login, sign-up, password-reset and similar routes are rate limited; reset links work once and expire after 30 minutes.
- The session cookie is HttpOnly, Secure and SameSite=Lax. HTTPS is forced and HSTS is sent in production.
- The database connection is encrypted and the provider certificate is checked.
- Every person can only read and delete their own quotes and enquiries. There are no admin pages.
- Profile pictures must be real JPEG, PNG or WebP files under 90 KB.
- Error details go to the server log only, never to visitors.

Set a database user for the site that can only read and change data in its own database (not create users or other databases), and rotate any key that has ever been pasted into a chat, email or ticket.
