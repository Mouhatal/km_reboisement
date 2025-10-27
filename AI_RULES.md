# AI Assistant Rules for this Project

This document outlines the technical stack and guidelines for developing features within this application.

## Tech Stack Overview

*   **Framework:** Next.js (version 13.5.1) for server-side rendering, routing, and API routes.
*   **Language:** TypeScript for type safety and improved code quality.
*   **Styling:** Tailwind CSS for utility-first styling.
*   **Database & Authentication:** Supabase for backend services, including PostgreSQL database and user authentication.
*   **UI Components:** React (version 18.2.0) as the core UI library.
*   **Mapping:** `react-leaflet` and `leaflet` for interactive map functionalities.
*   **Charting:** `recharts` for data visualization and displaying charts.
*   **Icons:** `lucide-react` for vector icons.
*   **Date Management:** `date-fns` for parsing, formatting, and manipulating dates.

## Library Usage Rules

To maintain consistency and efficiency, please adhere to the following library usage guidelines:

*   **Styling:**
    *   **ALWAYS** use Tailwind CSS classes for all styling. Avoid custom CSS files or inline styles unless absolutely necessary for dynamic values.
    *   **Prioritize Shadcn/ui components** for new UI elements. If a suitable Shadcn/ui component exists, use it. If not, create a new component using Tailwind CSS.
*   **Icons:**
    *   **ALWAYS** use icons from `lucide-react`.
*   **Maps:**
    *   **ALWAYS** use `react-leaflet` and `leaflet` for any map-related features.
*   **Charts & Data Visualization:**
    *   **ALWAYS** use `recharts` for creating graphs and charts.
*   **Date & Time Operations:**
    *   **ALWAYS** use `date-fns` for any date formatting, parsing, or manipulation tasks.
*   **State Management:**
    *   For local component state, use React's `useState`.
    *   For global or shared state (like authentication), leverage React's Context API as demonstrated by `AuthContext`. Avoid introducing new global state management libraries unless explicitly approved.
*   **Routing:**
    *   Utilize Next.js's built-in file-system routing and `next/navigation` hooks for all navigation.
*   **Backend Interactions:**
    *   All database and authentication interactions should be performed using the `supabase` client from `@supabase/supabase-js`.
*   **File Structure:**
    *   New pages should be created in the `app/` directory.
    *   New components should be created in the `components/` directory.
    *   Utility functions, types, and the Supabase client should reside in the `lib/` directory.