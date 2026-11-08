// Ad network tags for movieflix.stream. Shared by server (app/layout.js) and client.

export const ADS_PREF_KEY = "movieflix_ads_enabled";
export const ADS_OFF_CLASS = "ads-off";

const BANNER_HOST = "https://bancadeltempoidea.org";

// IFRAME SYNC display banners (key → size)
export const BANNERS = {
  "728x90": { key: "e53e7807a20e6b0038715f4c7df9c6c5", width: 728, height: 90 },
  "468x60": { key: "20e19952987074257464ba67b02577ef", width: 468, height: 60 },
  "320x50": { key: "6b3381005a5c046ab7ef11496c2480ba", width: 320, height: 50 },
  "300x250": { key: "d4ec7142730c9af8354c2261d9ec5178", width: 300, height: 250 },
  "160x600": { key: "28db922dc28d2cff1ff9585e3d6b0868", width: 160, height: 600 },
  "160x300": { key: "d930293a74da3f746b507a94a10bad7c", width: 160, height: 300 },
};

export const bannerScriptSrc = (key) => `${BANNER_HOST}/22/${key}`;

// NATIVE ASYNC (one per page — its container id is fixed)
export const NATIVE_KEY = "cf80adbf1b8838f692424daf4d9825bb";
export const NATIVE_SRC = `${BANNER_HOST}/21/${NATIVE_KEY}`;
export const NATIVE_CONTAINER_ID = `container-${NATIVE_KEY}`;

// Page-level JS tags
export const POPUNDER_SRC = "https://aarems.org/1/2d9b948b06cb881b852a0e5b89093ad5";
export const SOCIALBAR_SRC = `${BANNER_HOST}/14/b4946e1a6ab532293e6f60975349cdcc`;

// Runs in <head> before the page paints. Only toggles a class on <html>
// (no DOM insertion, so React hydration is unaffected). Ad scripts are
// loaded by components/AdsBootstrap.js when ads are on.
export const ADS_BOOTSTRAP_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  ADS_PREF_KEY
)})==="0")document.documentElement.classList.add(${JSON.stringify(ADS_OFF_CLASS)});}catch(e){}})();`;
