// @ts-expect-error - It does not have types
import hashes from "jshashes";
export function sha1(string: string): string {
  return (new hashes.SHA1()).hex(string);
}
