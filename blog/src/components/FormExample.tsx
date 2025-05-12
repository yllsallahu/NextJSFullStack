import React, { ChangeEvent, useState } from 'react';

export default function FormExample() {
  const [name, setName] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    console.log(event.target.value);
  };

  return (
    <form className="p-6">
      <label className="block text-lg font-bold">Emri juaj:</label>
      <input
        type="text"
        value={name}
        onChange={handleChange}
        className="border rounded p-2 w-full mt-2"
      />
      <p className="mt-4">Emri i vendosur: {name}</p>
    </form>
  );
}
