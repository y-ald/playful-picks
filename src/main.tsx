
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Hydration function for client-side rendering
function hydrateOrRender() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Failed to find the root element");
  }

  // Check if the app was pre-rendered on the server
  if (rootElement.hasChildNodes()) {
    // Hydrate existing server-rendered HTML
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } else {
    // Do a full client-side render if no server rendering
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
}

// Execute hydration after the document is fully loaded
// This helps with hydration mismatch errors
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateOrRender);
} else {
  hydrateOrRender();
}

// Add pre-fetching for links to improve page load performance
if ('IntersectionObserver' in window) {
  const prefetchLink = (url: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLAnchorElement;
        if (link.href && link.href.startsWith(window.location.origin)) {
          prefetchLink(link.href);
        }
        observer.unobserve(link);
      }
    });
  });

  // Observe all links when page loads
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a').forEach(link => {
      observer.observe(link);
    });
  });
}
