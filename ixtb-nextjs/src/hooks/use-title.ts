"use client";

import { useEffect } from "react";

/**
 * A hook that updates the document title
 * @param title - The title to set for the document
 */
const useTitle = (title: string): void => {
  useEffect(() => {
    // Store the original title
    const originalTitle = document.title;

    // Update the title
    document.title = title;

    // Cleanup function to restore the original title when component unmounts
    return () => {
      document.title = originalTitle;
    };
  }, [title]); // Re-run effect when title changes
};

export default useTitle;
