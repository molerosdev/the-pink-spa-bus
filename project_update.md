PRD: Hero Section Redesign – Bus-Centric Experience
Project Overview

Redesign the homepage hero section to make The Pink Spa Bus the immediate visual focus.

The current hero successfully communicates the brand but places too much emphasis on text and insufficient emphasis on the actual spa bus experience.

The new hero should allow visitors to immediately understand:

What the Pink Spa Bus looks like
The size and uniqueness of the bus
The interior spa experience
That this is a mobile luxury spa party venue

The bus should become the dominant visual element while maintaining clear messaging and call-to-action visibility.

Business Goal

Increase user understanding of the unique selling proposition within the first 3 seconds:

"A luxury mobile spa experience inside a real pink spa bus."

Design Direction
Current State
Large white content container
Background imagery partially obscured
Bus is visible but secondary
Text dominates the viewport
Desired State
Bus imagery dominates the hero
Text supports the visuals
Multiple views of the bus are showcased
Visitors immediately recognize the bus as the attraction
Hero Layout
Desktop Layout

Two-column layout.

Left Column

Content only.

Include:

Main headline
Supporting subheadline
CTA buttons

Width:

Approximately 35–40%
Right Column

Bus visual gallery.

Width:

Approximately 60–65%

This side should become the focal point of the page.

Visual Gallery Requirements

Display multiple bus images simultaneously.

Suggested composition:

Primary Image

Large featured image.

Content:

Exterior bus photo

Occupies:

70% of gallery area
Secondary Images

Two smaller supporting images.

Content:

Interior spa setup
Additional bus angle specified by client

Layout:

Stacked vertically
Or staggered card layout

Example:

---

| |
| Exterior Bus Photo |
| |

---

| Interior | Bus View |

---

Remove Existing White Card

Remove the large white rectangle currently placed over the hero image.

Reason:

It hides the main attraction and reduces visual impact.

Replace with:

Clean text container
No solid white background
Optional subtle glass effect (10–15% opacity)

The bus imagery must remain fully visible.

Image Treatment
Blur

Reduce current blur significantly.

Target:

60–80% less blur than current implementation

Images should appear crisp and professional.

Overlay

Apply subtle overlay only if needed for readability.

Recommended:

Soft pink gradient
Very light dark overlay

Goal:

Improve text contrast without hiding images.

Hero Height

Increase visual impact.

Desktop:

85vh to 100vh

The hero should feel premium and immersive.

Animation Requirements

Animations must be subtle.

Image Entrance

On page load:

Fade in
Slight upward motion

Duration:

500–700ms
Gallery Hover Effects

On hover:

Slight scale effect (1.02–1.05)
Soft shadow increase

No aggressive movement.

Floating Motion

Optional:

Very subtle floating animation on supporting images.

Movement:

3–5 pixels

Cycle:

6–8 seconds
Mobile Layout

Stack vertically.

Order:

Section 1

Headline

Section 2

CTA Buttons

Section 3

Bus image gallery

OR

Preferred

Bus gallery first, then headline and CTA.

Reason:

Mobile visitors should immediately see the bus.

Performance Requirements

Images must be optimized.

Requirements:

WebP format
Lazy load secondary images
Responsive image sizing
Maintain Lighthouse performance above 90
Future-Proofing

The gallery component must allow easy replacement/addition of images.

Developer should create image array structure such as:

const heroImages = [
exteriorBusMain,
interiorBus,
exteriorBusAlt,
];

Allowing future additions without redesign.

Acceptance Criteria
Success Condition 1

Visitor can immediately identify the Pink Spa Bus within the first viewport.

Success Condition 2

At least three bus-related images are visible in the hero section.

Success Condition 3

No large opaque white container blocks hero imagery.

Success Condition 4

Headline and CTA remain readable on desktop and mobile.

Success Condition 5

Hero clearly communicates that the bus itself is the unique attraction.

Success Condition 6

Subtle animations enhance the experience without impacting performance.

Implementation Priority
Remove white hero card.
Create two-column desktop layout.
Add 3-image bus gallery (exterior + interior + additional image).
Reduce blur and improve image clarity.
Add subtle animations.
Optimize mobile experience with bus-first presentation.

This redesign shifts the hero from a typical service landing page into a product showcase, which aligns directly with the client's feedback that the bus—not the text—is the star of the experience.
