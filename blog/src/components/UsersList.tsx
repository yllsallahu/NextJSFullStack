import { useState, useEffect } from "react";

export default function UsersList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/users")
      .then((response) => response.json())
      .then((data) => setUsers(data));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Lista e Përdoruesve</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="border-b py-2">
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
