# PRD: Gallery Section Reorganization

## Project Overview

Reorganize the existing Gallery section to remove all party/package-based grouping and display all gallery photos in a single unified gallery experience.

The objective is to allow visitors to browse all event photos together without separating them by package or event type.

---

# Scope

This change applies only to the Gallery section.

No changes are required to other sections of the website.

---

# Objective

Create a single mixed gallery containing all available gallery photos.

Visitors should be able to:

- View a large featured image.
- Watch images rotate automatically.
- Pause automatic rotation.
- Navigate manually using previous/next controls.
- Select images directly from thumbnail previews.

---

# Gallery Structure

## Main Display Area

A large featured image should be displayed at the top of the gallery section.

Requirements:

- Display one image at a time.
- Occupy the majority of the gallery section width.
- Automatically transition through all gallery images.

---

## Thumbnail Navigation

Display a horizontal scrolling strip of thumbnails below the main image.

Requirements:

- Include all gallery images.
- Unlimited horizontal scrolling.
- Clicking a thumbnail immediately updates the featured image.
- Active thumbnail should be visually highlighted.

---

# Gallery Content

## Image Source

Combine all existing gallery images into a single image collection.

Requirements:

- Remove all party-based categories.
- Remove package-based grouping.
- Remove event-based sections.

All images should appear together within the same gallery.

---

# Automatic Slideshow

## Rotation Behavior

Automatically rotate through gallery images.

Requirements:

- Change image every 10 seconds.
- Continue looping indefinitely.
- Cycle through all images in sequence.

---

## Pause Control

Provide a visible control to pause and resume slideshow playback.

Requirements:

- Pause button stops automatic image rotation.
- Play button resumes automatic image rotation.
- Current image remains visible when paused.

---

# Manual Navigation

## Previous / Next Controls

Provide navigation controls on the featured image.

Requirements:

- Previous button displays the previous image.
- Next button displays the next image.
- Manual navigation must work whether slideshow is playing or paused.

---

# Image Presentation

## Display Style

Requirements:

- Photos only.
- No captions.
- No event names.
- No package names.
- No overlays containing text.
- No labels displayed on images.

---

# Mobile Requirements

## Responsive Behavior

Requirements:

- Featured image displayed first.
- Thumbnail strip remains available below the featured image.
- Horizontal swipe on thumbnail strip allowed through native scrolling.
- Previous and Next controls remain accessible on mobile devices.

---

# Acceptance Criteria

### AC-1

All gallery images are displayed within a single mixed gallery.

### AC-2

No gallery categories or package-based sections remain visible.

### AC-3

A large featured image is displayed above the thumbnail strip.

### AC-4

The gallery automatically advances every 10 seconds.

### AC-5

Users can pause and resume the slideshow.

### AC-6

Users can navigate using Previous and Next controls.

### AC-7

Users can select any image by clicking its thumbnail.

### AC-8

Thumbnail navigation supports unlimited horizontal scrolling.

### AC-9

No captions, labels, package names, or event names are displayed.

### AC-10

Gallery functions correctly on desktop, tablet, and mobile devices.
