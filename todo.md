# AlShami AI Image Generator TODO

## Database & Schema
- [x] Create images table to store generated images metadata
- [x] Add user relationship to track who generated what

## Backend API Integration
- [x] Request Manus API key secret from user
- [x] Create image generation procedure using Manus API
- [x] Implement error handling for API failures
- [x] Add procedure to fetch user's image history

## Frontend UI
- [x] Design landing page with hero section
- [x] Create image generation form with prompt input
- [x] Build image display component with loading states
- [x] Create gallery view for user's generated images
- [x] Add authentication flow (login/logout)
- [x] Implement responsive design

## Enhancements
- [x] Rename app to "AlShami AI Image Generator"
- [x] Add dark mode support with theme toggle

## Refactoring to Built-in Helper
- [x] Replace direct Manus API calls with built-in generateImage helper
- [x] Remove polling mechanism from backend
- [x] Simplify frontend to handle synchronous image generation
- [x] Test complete flow with built-in helper
- [x] Create final checkpoint

## UI Enhancements & New Features
- [x] Remove Manus popup notification from lower right
- [x] Simplify footer to only show "Built with ❤️"
- [x] Add "Enhance Prompt" button with AI integration
- [x] Create dedicated full-page AI chat interface
- [x] Add navigation to AI chat page
- [x] Test all new features
- [x] Create checkpoint with enhancements

## Website Name Update
- [x] Update APP_TITLE constant in const.ts to "AlShami AI Image Generator"
- [x] Update all hardcoded references in Home.tsx
- [x] Verify name appears correctly throughout the app
- [x] Create checkpoint with updated name

## Image-to-Image Transformation Feature
- [x] Add image upload UI component with drag-and-drop
- [x] Implement file validation (size, type)
- [x] Add image preview before transformation
- [ ] Create S3 upload functionality for user images
- [x] Add backend procedure for image-to-image transformation
- [x] Create style selection UI (anime, DBZ, Ghibli, realistic, etc.)
- [x] Design tabbed interface (Text-to-Image vs Image-to-Image)
- [x] Test image upload and transformation flow
- [x] Create checkpoint with image-to-image feature
