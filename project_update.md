PROJECT: Services Page – Package Card Flip Animation Enhancement

OBJECTIVE

Replace the current package details expansion behavior with an interactive flip-card experience.

When a visitor clicks the "View full details" section on any package card, the card should smoothly flip and reveal the complete package details on the reverse side of the same card.

No content changes are required.

No pricing changes are required.

No layout changes are required.

This update only affects the package card interaction.

CURRENT BEHAVIOR

- Package cards display summary information.
- Clicking the "+" icon expands content below or within the card.

NEW BEHAVIOR

- Package cards remain unchanged on initial page load.
- Clicking the "View full details" section triggers a card flip animation.
- The front side rotates out of view.
- The back side rotates into view.
- Full package information is displayed on the back side.
- The card remains in the flipped state until the user closes it.

CARD FRONT CONTENT

Maintain current content:

- Package image
- Package badge
- Package name
- Package price
- Duration
- Guest count
- Short summary
- Book This Package button
- "+" icon

CARD BACK CONTENT

Display all package details currently contained within the expandable section, including:

- What's Included
- The Experience
- Important Information

BACK CARD ACTIONS

Display a visible action allowing users to return to the front side.

Accepted options:

- Back Arrow Icon
- Close (X) Icon
- "Back to Package Summary" button

User interaction should flip the card back to its original front state.

ANIMATION REQUIREMENTS

- Smooth 3D card flip animation
- Horizontal flip effect
- Duration between 300ms and 600ms
- Animation must feel premium and responsive
- No page jump
- No layout shifting
- No content pushing other cards vertically

RESPONSIVE BEHAVIOR

Desktop:

- Flip occurs within the existing card container
- Neighboring cards remain stationary

Tablet:

- Same behavior as desktop

Mobile:

- Flip animation remains enabled
- Content remains fully readable
- No overflow outside viewport

CARD HEIGHT REQUIREMENTS

- Front and back sides must maintain consistent dimensions.
- Back side should support scrolling internally if content exceeds available height.
- Overall page layout should remain stable during card interactions.

ACCESSIBILITY REQUIREMENTS

- "+" icon must be keyboard accessible.
- Flip action must support keyboard navigation.
- Focus state must remain visible.
- Screen readers should properly identify interactive elements.

VISUAL REQUIREMENTS

Maintain existing:

- Branding
- Colors
- Typography
- Shadows
- Borders
- Rounded corners

No visual redesign is required.

ACCEPTANCE CRITERIA

- Clicking "View full details" flips the card instead of expanding content.
- Full package information appears on the back side.
- Users can return to the front side without refreshing the page.
- No page layout movement occurs during interaction.
- All package information remains readable.
- Flip animation works on desktop, tablet, and mobile.
- Existing branding and styling remain unchanged.
- Contact form integration and "Book This Package" functionality remain unchanged.
- Only the package card interaction behavior is modified.
