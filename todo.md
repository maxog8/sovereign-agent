# AI Image Generator TODO

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

## Testing & Deployment
- [x] Test image generation flow end-to-end
- [x] Verify token usage tracking
- [x] Create checkpoint for deployment

## Enhancements
- [x] Rename app to "AlShami AI Image Generator"
- [x] Add dark mode support with theme toggle
- [x] Implement real task polling for Manus API
- [x] Add image download functionality
- [x] Create prompt template suggestions
- [x] Test all new features
- [x] Create final checkpoint

## Bug Fixes
- [x] Fix Manus API authentication header format (401 error)
- [ ] Test image generation after fix
- [ ] Create checkpoint with fix

## Debugging
- [ ] Fix MANUS_API_KEY environment variable loading issue
- [ ] Debug why polling returns 400 errors despite API working in curl
- [ ] Verify environment variables are properly loaded in server

## Refactoring to Built-in Helper
- [x] Replace direct Manus API calls with built-in generateImage helper
- [x] Remove polling mechanism from backend
- [x] Simplify frontend to handle synchronous image generation
- [x] Test complete flow with built-in helper
- [x] Create final checkpoint

## AI Chat Agent Feature
- [x] Create backend chat API with LLM integration
- [x] Add chat message storage to database
- [x] Integrate AIChatBox component in frontend
- [x] Configure chat agent with helpful system prompt
- [x] Test chat functionality
- [x] Create checkpoint with chat feature

## Chat Visibility Bug Fix
- [ ] Debug why chat button is not visible
- [ ] Fix chat button positioning and z-index
- [ ] Verify chat button appears for authenticated users
- [ ] Test chat functionality end-to-end
- [ ] Create checkpoint with working visible chat

## Website Name Update
- [x] Update APP_TITLE constant in const.ts to "AlShami AI Image Generator"
- [x] Update all hardcoded references in Home.tsx
- [x] Verify name appears correctly throughout the app
- [x] Create checkpoint with updated name
