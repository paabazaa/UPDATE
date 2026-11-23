# SURGICISS LTD: design file

One place that says how the site should look, so every new page and every change starts from the same rules. Read it before changing the look; update it when a rule changes.

## Character
A clinical supplier that is calm, exact and trustworthy. Plain words, real photographs of real sterile processing departments, one purple brand colour used with restraint. It should feel like a medical supplier's catalogue, not a software start-up.

## Colour
- One brand purple, used **flat**. No purple gradients on buttons, bars, panels, banners or footers. Solid fills only.
- Gradients are allowed in exactly two kinds of place: the dark scrims laid over photographs so white text stays readable, and the sign-in / sign-up side panel and the account dashboard header, whose designs are fixed.
- Colours live as variables at the top of `public/css/styles.css` (`--primary`, `--tint`, `--accent-bg`, `--footer`, `--border`, `--fg`, `--muted-fg`). Use the variables, never a new hex or `oklch` value in a rule.
- Light and dark theme both ship. Every new rule must work in both.
- Red is only for destructive actions (delete, log out).

## Type
- One family: **Barlow** (400, 500, 600, 700), loaded from Google Fonts, with the system sans as fallback.
- Headings are uppercase and tracked only for section and card titles. Body copy is sentence case at 16px, line height 1.5.
- Headlines say something specific about the work ("Simple innovations that get sterile processing right the first time"), not a company name or a slogan.

## Layout
- Content width 1200px, 16px side gutter on phones, no horizontal scroll.
- Do not stack two rows of three equal cards. The home page shows services as three cards and products as one large card beside two compact ones. Use a different arrangement when two lists sit near each other.
- Sections alternate plain and tinted backgrounds. Spacing between sections is generous and consistent.

## Images
- Real photographs and real product or software screens only. No stock-looking people, no illustrations standing in for products.
- Every image has a width and height, `alt` text when it carries meaning, and lazy loading below the fold.

## Icons
- One set of inline line icons (the `icons` object in `public/js/site/core.js`). **No emoji** anywhere in the interface.

## Motion
- No animation on scroll. Motion is limited to hover and focus feedback, the hero slide change, and the modal pop-up.

## Content rules
- No invented testimonials, ratings, client logos or statistics. Only claims the company can back.
- No placeholder text, template wording or builder branding anywhere.

## Fixed designs (do not redesign)
- Sign in and create account pages.
- The account dashboard and its drop-down.

## Checking a change
Run `npm run screenshots` and look at the pictures in `screenshots/` at desktop and phone width before calling a design change done. `npm run test:pages` checks the pages in a real browser.
