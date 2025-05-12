import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="text-center p-6">
      <h2 className="text-2xl font-bold">Numri: {count}</h2>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-600 text-white rounded mt-2"
      >
        Shto 1
      </button>
    </div>
  );
}
