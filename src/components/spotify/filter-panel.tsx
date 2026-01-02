import { use } from "react";

export function FilterPanel({
  users,
  selectedUsers,
}: {
  users: { id: string; name: string | null; }[];
  selectedUsers: { id: string; name: string | null; }[];
}) {
  return <aside>
    <h2>Filter</h2>

    <div>
      <h3>Users</h3>
      <ul>
        {users.map(user =>
          <li key={"filer-" + user.id}>
            {user.name ?? "Unknown User"}
          </li>
        )}
      </ul>
    </div>
  </aside>;
}