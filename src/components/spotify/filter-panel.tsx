import { Checkbox } from "@/components/ui/checkbox";

export function FilterPanel({
  users,
  selectedUsers,
}: {
  users: { id: string; name: string | null; }[];
  selectedUsers: { id: string; name: string | null; }[];
}) {

  for (const user of users) {
    if (user.name === null) {
      console.warn("User with null name detected:", user);
    }
  }

  return (
    <section
      className={`
        flex flex-col justify-center
      `}
    >
      <div className="w-fit">
        <h4>Ministrar</h4>
        <div className="flex flex-col">
          {users.map(user =>
            <label
              key={"filter-" + user.id}
              className="flex justify-end items-center gap-x-2 w-full"
            >
              {user.name?.replace(/\s/g, "\u00a0") ?? "!!FEL!!"}
              <Checkbox
                defaultChecked={selectedUsers.some(u => u.id === user.id)}
              />
            </label>
          )}
        </div>
      </div>
    </section>
  );
}