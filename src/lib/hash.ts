// @ts-expect-error - It does not have types
import hashes from "jshashes";
export function sha1(string: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return (new hashes.SHA1()).hex(string);
}
