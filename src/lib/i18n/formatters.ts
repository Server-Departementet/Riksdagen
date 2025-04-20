
export function possessive(name: string) {
  // Swedish
  if (["s", "x", "z"].includes(name.slice(-1).toLowerCase())) {
    // Nothing
  } else {
    name = name + "s";
  }
  return name;
}