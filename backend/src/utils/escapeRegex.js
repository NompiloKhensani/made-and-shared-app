// Escape user input before using it in a MongoDB regular expression.
const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = escapeRegex;
