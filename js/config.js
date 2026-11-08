/* ===== Yeaxmi site settings =====
   1) In Google Sheets: File > Share > Publish to web > choose the "Products" tab > CSV > Publish. Paste that link below.
   2) Do the same for the "Plans" tab.
   Leave a URL empty to use the sample files in /data instead. */
window.Yeaxmi_CONFIG = {
  PRODUCTS_CSV_URL: "",   // e.g. https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv
  PLANS_CSV_URL: "",      // e.g. https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=123456&single=true&output=csv
  CACHE_MINUTES: 5,       // how long a visitor's browser keeps the sheet data
  PER_PAGE: 12,           // products per page on products.html
  CHECKOUT_URL: "cart.html",
  CATEGORY_IDS: {
    "fd611e6e-2597-4d68-9578-34667181eafa": "AI Tools",
    "9ebda781-7c1f-435b-bea9-793eb8d61cdb": "Adobe Creative Cloud",
    "f512e338-12f4-48fb-a518-60f7d4cea568": "Digital Key",
    "5a9c7fc4-1828-4073-919b-8d0b9e83fccc": "Editing Tools",
    "3a581d0c-eda6-4f1f-ad6c-8d56b8766e04": "Subscriptions"
  }
};
