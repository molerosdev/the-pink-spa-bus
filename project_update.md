# PRD — Add Rentals Section to Packages Page

**Project:** The Pink Spa Bus
**Page:** `/packages`
**Target placement:** Directly below the current Packages section
**Reference style:** Use the uploaded rental flyer as visual/content inspiration, but keep The Pink Spa Bus website branding.

## 1. Objective

Add a new **Rentals** section below the packages section on the Packages page.

The goal is to let visitors see the rental items The Pink Spa Bus can offer for parties and events. This is **not an eCommerce feature**. Customers should only view available rental options, pricing, and basic descriptions, then contact the business manually through the existing contact form, WhatsApp, email, or phone.

## 2. Important Developer Instruction

Check the project files inside the existing **`rentals` folder** and use those images/assets to build this section.

The uploaded flyer is only a reference for visual direction and rental item examples. The final section should be built using the actual assets available in the project’s `rentals` folder.

## 3. Section Placement

Add the new section here:

`/packages`

Placement:

1. Current hero/header area
2. Current packages section
3. **New Rentals section**
4. Existing contact/reserve/footer sections

The rentals section must feel naturally connected to the packages page, not like a separate unrelated block.

## 4. Section Name

Use one of these titles:

**Preferred title:**
`Party Rentals`

Optional subtitle:
`Add extra fun, seating, and party essentials to your celebration.`

Alternative title if it fits the design better:
`The Pink Experience Rentals`

## 5. Rental Items to Include

The section should include the following rental categories/items:

1. **Inflatables**
   - For kids’ entertainment and party games.
   - Pricing may vary.
   - Display as “Starting at” or “Contact for pricing” if exact pricing is not available.

2. **Kids Chairs**
   - Example reference price: `$2 each`
   - Use image from rentals folder if available.

3. **Kids Tables**
   - Example reference price: `$6 each`
   - Use image from rentals folder if available.

4. **Cocktail High Table**
   - Example reference price: `$10 each`
   - Use image from rentals folder if available.

5. **Adult Chairs**
   - Example reference price: `$4 each`
   - Use image from rentals folder if available.

6. **Mini Pancakes Cart**
   - Use image from rentals folder if available.
   - Price may vary.
   - Display “Contact for pricing” if no exact price is provided.

7. **Mixed Kids Games**
   - Include games suitable for both boys and girls.
   - This can be shown as one card called:
     `Kids Party Games`
   - Description:
     `Fun game options for mixed kids’ parties, birthdays, and special celebrations.`
   - Price may vary.

## 6. Pricing Display Rules

This website is not an online store.

Display prices only for informational purposes.

Use pricing format:

- `$2 each`
- `$4 each`
- `$6 each`
- `$10 each`
- `Starting at $X`
- `Contact for pricing`

Where prices are not confirmed, use:

`Contact for pricing`

Do not create checkout logic, cart logic, item quantity selector, or online payment flow.

## 7. User Interaction

For this phase, rental cards should be **view-only**.

Do not add:

- Add to cart
- Select item
- Quantity selector
- Checkout
- Online reservation cart
- Dynamic rental calculator

Allowed CTA options:

Each rental card may have a small CTA such as:

`Ask About This Rental`

When clicked, it should direct the user to the existing contact section or existing contact form.

Recommended behavior:

- Anchor link to contact form.
- Optional: pass no data for now.
- Keep it simple.

Example:

`Ask About Rentals` button at the bottom of the section linking to the contact form.

## 8. Contact Direction

At the bottom of the section, include a short note:

`Interested in adding rentals to your party? Contact us and tell us which items you would like to include.`

Include a CTA button:

`Ask About Rentals`

The button should link to the existing contact/reservation form or WhatsApp/contact option already used on the website.

## 9. Design Direction

The client likes the rental flyer style, but the final design must stay consistent with **The Pink Spa Bus branding**.

Design should feel:

- pink,
- fun,
- luxury,
- clean,
- kid-friendly,
- party-focused,
- polished and professional.

Use the current website’s:

- color palette,
- typography,
- button style,
- rounded cards,
- soft shadows,
- luxury/pink spa visual language.

Do not copy the flyer exactly. Use it as inspiration only.

## 10. Suggested Layout

Use a responsive rental card grid.

Desktop:

- 3 cards per row preferred.
- If space allows, 4 cards can be used only if the design remains clean.

Tablet:

- 2 cards per row.

Mobile:

- 1 card per row.

Each rental card should include:

- Rental image
- Rental name
- Short description
- Price label
- Optional “Ask About This Rental” link/button

Example card structure:

```text
[Image]

Kids Chairs
Perfect seating for kids’ parties, birthdays, and spa celebrations.

$2 each

Ask About This Rental
```

## 11. Visual Elements

Use icons or small labels similar to the flyer if it fits the current site.

Possible trust/feature labels:

1. `Clean & Safe`
   - `Sanitized before every event`

2. `Pickup & Delivery`
   - `Convenient and on time`

3. `Perfect for Any Event`
   - `Birthdays, parties, and more`

These can appear below the rental grid as a small 3-column feature row.

## 12. Content Copy

Suggested section copy:

### Section Header

```text
Party Rentals
Add extra fun, seating, and party essentials to your celebration.
```

### Section Description

```text
Make your event even more special with our rental options. From kids tables and chairs to inflatables, games, and sweet party extras, our rentals help complete the full Pink Experience.
```

### Rental Cards

#### Inflatables

```text
Inflatables
Fun inflatable options for kids’ parties, birthdays, and outdoor celebrations.

Contact for pricing
```

#### Kids Chairs

```text
Kids Chairs
Comfortable white kids chairs, perfect for birthdays, spa parties, and table setups.

$2 each
```

#### Kids Tables

```text
Kids Tables
Kid-friendly tables for food, activities, crafts, and party setups.

$6 each
```

#### Cocktail High Table

```text
Cocktail High Table
A stylish high table option for decorations, treats, drinks, or event display areas.

$10 each
```

#### Adult Chairs

```text
Adult Chairs
Clean and elegant seating options for parents, family members, and guests.

$4 each
```

#### Mini Pancakes Cart

```text
Mini Pancakes Cart
A sweet party add-on that brings a fun dessert-style experience to your celebration.

Contact for pricing
```

#### Kids Party Games

```text
Kids Party Games
Fun games for mixed kids’ parties, perfect for boys and girls to enjoy together.

Contact for pricing
```

## 13. Bilingual Scope

For now, keep this new Rentals section in **English only**.

The website will be made fully bilingual later, but this task should only implement the rental section in English.

Important: structure the content in a clean way so it can be translated later without major refactoring.

## 14. Technical Requirements

The section can be hardcoded for now.

Recommended data structure:

```js
const rentalItems = [
  {
    name: "Kids Chairs",
    description:
      "Comfortable white kids chairs, perfect for birthdays, spa parties, and table setups.",
    price: "$2 each",
    image: "/rentals/kids-chair.jpg",
  },
];
```

The exact image names should be taken from the existing `rentals` folder.

Developer must:

- Inspect the `rentals` folder.
- Match each card with the correct available image.
- Use fallback styling if an image is missing.
- Optimize image loading.
- Keep responsive behavior clean.
- Avoid adding cart or checkout logic.

## 15. Acceptance Criteria

The task is complete when:

1. A new Rentals section appears below the packages section on `/packages`.
2. The section uses The Pink Spa Bus branding.
3. Rental cards are displayed with image, name, description, and price.
4. Items included are:
   - Inflatables
   - Kids Chairs
   - Kids Tables
   - Cocktail High Table
   - Adult Chairs
   - Mini Pancakes Cart
   - Kids Party Games

5. Prices display as informational only.
6. No cart, checkout, quantity selector, or payment flow is created.
7. Users can easily contact the business to ask about rentals.
8. The section is responsive on desktop, tablet, and mobile.
9. Images are taken from the `rentals` folder.
10. The uploaded flyer is used only as a visual reference, not copied exactly.
11. The page remains fast, clean, and visually consistent.
12. The section is English-only for now.

## 16. Out of Scope

Do not implement:

- Shopping cart
- Checkout
- Payment processing
- Rental quantity selector
- Availability calendar
- Rental booking system
- Admin panel
- CMS
- Spanish translation for this section
- New package creation
- Price calculator
- Inventory management

## 17. Final Developer Note

Build this as a polished visual section, not an eCommerce feature. The customer should be able to browse rental options and understand the available products and general pricing, then contact The Pink Spa Bus manually to request them.
