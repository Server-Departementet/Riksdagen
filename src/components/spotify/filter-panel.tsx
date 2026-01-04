"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function FilterPanel({
  users,
  selectedUsers: initialSelectedUsers,
  query: initialQuery,
}: {
  users: { id: string; name: string | null; }[];
  selectedUsers: { id: string; name: string | null; }[];
  query?: string;
}) {
  for (const user of users) {
    if (user.name === null) {
      console.warn("User with null name detected:", user);
    }
  }

  const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
  const [searchQuery, setSearchQuery] = useState(initialQuery ?? "");

  return (
    <form
      className={`
        flex flex-col justify-center
        gap-y-4
      `}
      action={() => {
        // Reload with selected users as query params
        const params = new URLSearchParams();
        if (selectedUsers.length > 0) {
          params.append(
            "users",
            selectedUsers.map(u => u.id).join(","),
          );
        }

        if (searchQuery.trim() !== "") {
          params.append(
            "q",
            searchQuery.trim(),
          );
        }

        window.location.search = params.toString();
      }}
    >
      {/* User filter */}
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
                onClick={(e) => {
                  if (!(e.target instanceof HTMLButtonElement)) return;

                  if (e.target.dataset.state === "unchecked") {
                    setSelectedUsers(prev => [
                      ...prev,
                      user,
                    ]);
                  }
                  else {
                    setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div>
        <label>
          <h4>Search</h4>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
            placeholder="Sök låt, album eller artist"
          />
        </label>
      </div>

      {/* Refresh button */}
      <Button
        type="submit"
        variant={"outline"}
        className="hover:bg-gray-800 hover:text-white"
      >
        Uppdatera
      </Button>
    </form>
  );
}