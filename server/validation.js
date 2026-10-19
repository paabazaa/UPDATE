// Input checks for the API. Only known fields are kept, trimmed and length-limited.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_METHODS = ["Email", "Telephone", "Either"];

export const text = (value, max) => String(value ?? "").trim().slice(0, max);
export const normaliseEmail = value => text(value, 254).toLowerCase();
export const isEmail = value => EMAIL.test(value);

const fail = error => ({error});

export function checkPassword(password, confirm) {
  if (typeof password !== "string" || password.length < 8) return "Use at least 8 characters. Choose a password you do not use anywhere else.";
  if (password.length > 128) return "Use no more than 128 characters for the password.";
  if (confirm !== undefined && password !== confirm) return "The two passwords do not match.";
  return "";
}

export function cleanProfile(input) {
  return {
    name: text(input.name, 255),
    phone: text(input.phone, 255),
    organisation: text(input.organisation, 255),
    country: text(input.country, 255),
    city: text(input.city, 255),
    deliveryLocation: text(input.deliveryLocation, 500)
  };
}

export function cleanSignup(input) {
  const profile = cleanProfile(input);
  const email = normaliseEmail(input.email);
  if (profile.name.length < 2) return fail("Please tell us your name.");
  if (!isEmail(email)) return fail("Please enter a valid email address.");
  const passwordProblem = checkPassword(input.password, input.confirm);
  if (passwordProblem) return fail(passwordProblem);
  return {value: {...profile, email, password: input.password}};
}

function cleanContact(input, {needDelivery}) {
  const contact = input && typeof input === "object" ? input : {};
  const clean = {
    name: text(contact.name, 255),
    email: normaliseEmail(contact.email),
    phone: text(contact.phone, 255),
    organisation: text(contact.organisation, 255),
    country: text(contact.country, 255),
    city: text(contact.city, 255),
    preferredContact: CONTACT_METHODS.includes(contact.preferredContact) ? contact.preferredContact : "Email"
  };
  if (needDelivery) clean.deliveryLocation = text(contact.deliveryLocation, 500);
  if (clean.name.length < 2) return fail("Please tell us your name.");
  if (!isEmail(clean.email)) return fail("Please enter a valid email address.");
  if (clean.organisation.length < 2) return fail("Please tell us which organisation you represent.");
  if (clean.country.length < 2) return fail("Please enter your country.");
  if (needDelivery && clean.deliveryLocation.length < 2) return fail("Please say where the items are needed.");
  return {value: clean};
}

export function cleanQuote(record) {
  const input = record && typeof record === "object" ? record : {};
  const contact = cleanContact(input.contact, {needDelivery: true});
  if (contact.error) return contact;
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 50) return fail("Add between 1 and 50 items.");
  const lines = [];
  for (const line of input.lines) {
    const quantity = Number(line && line.quantity);
    const ref = text(line && line.ref, 120);
    if (!ref) return fail("Choose a product, system, service or programme for every line.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999999) return fail("Enter a whole number of 1 or more for every quantity.");
    lines.push({ref, name: text(line.name, 255) || ref, quantity, note: text(line.note, 240)});
  }
  return {value: {lines, contact: contact.value, requirements: text(input.requirements, 2000)}};
}

export function cleanEnquiry(record) {
  const input = record && typeof record === "object" ? record : {};
  const contact = cleanContact(input.contact, {needDelivery: false});
  if (contact.error) return contact;
  const message = text(input.message, 2000);
  const interest = text(input.interest, 255);
  if (message.length < 10) return fail("Please give us a little more detail.");
  if (!interest) return fail("Please choose what your enquiry relates to.");
  return {value: {subject: text(input.subject, 160), message, interest, contact: contact.value}};
}
