"use client";

import { useEffect } from 'react';

export default function QueryHash() {
  useEffect(() => {
    // 1. Safety check to ensure code only executes in the user's active browser viewport
    if (typeof window === 'undefined') return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const project = urlParams.get('p');
      if (!project) return;

      const id = decodeURIComponent(project);

      // Remove the p param from the search and set the hash without jumping
      urlParams.delete('p');
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + '#' + id;
      history.replaceState(null, '', newUrl);

      // Smoothly scroll to the element if it exists
      const target = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
      if (target) {
        // Use requestAnimationFrame to ensure layout is ready
        requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch (e) {
      // fail silently on older browsers
    }
  }, []);

  return null;
}
