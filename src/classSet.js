/**
 * Converts an object with boolean properties to a CSS string.
 * Only the property names with truthy values are included.
 */
const cx = obj =>
  Object.keys(obj).filter(prop => obj[prop]).join(' ');

export default cx;
