// Dark / light theme preference. Shared by the server (app/layout.js) and the client
// (components/ThemeToggle.js). Kept out of the "use client" file so the server layout
// gets the real string, not a client reference.

export const THEME_KEY = "movieflix_theme";

// Runs in <head> before the page paints, so a light-theme visitor never sees a dark flash.
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  THEME_KEY
)})==="light")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();`;
