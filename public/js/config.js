// Site settings. Everything in this file is downloaded by every visitor, so never put passwords or API secrets here.
//
// apiBase: address of the SURGICISS API (see server/ and the README), for example "https://api.example.com".
//   When it is set, accounts, quote requests and enquiries are stored in the MySQL database through the API.
//   When it is empty, the site works without a server and keeps accounts and requests in the visitor's browser only.
// submissionEndpoint: optional address of a different service that accepts quote and enquiry POSTs.
//   It is used only when apiBase is empty.
const SURGICISS_CONFIG = {
  apiBase: "",
  submissionEndpoint: ""
};
window.SURGICISS_CONFIG = SURGICISS_CONFIG;
