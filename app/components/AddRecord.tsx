import { Form } from "@remix-run/react";
import { useState } from "react";

export default function AddRecord({ onCancel }: { onCancel: () => void }) {
  const [type, setType] = useState("");

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mt-8">Dodaj novi DNS zapis</h2>
      <Form method="post" className="space-y-4 mt-4 max-w-sm">
        <div className="flex flex-col">
          <label htmlFor="name" className="font-medium">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            className="border p-2 rounded "
            required
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="type" className="font-medium">
            Type
          </label>
          <select
            name="type"
            id="type"
            className="border p-2 rounded"
            required
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">-- Odaberi tip --</option>
            <option value="1">A</option>
            <option value="28">AAAA</option>
            <option value="5">CNAME</option>
            <option value="15">MX</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="data" className="font-medium">
            Data
          </label>
          <input
            type="text"
            name="data"
            id="data"
            className="border p-2 rounded"
            required
          />
        </div>

        {type === "15" && (
          <div className="flex flex-col">
            <label htmlFor="priority" className="font-medium">
              Priority
            </label>
            <input
              type="number"
              name="priority"
              id="priority"
              className="border p-2 rounded"
              required
            />
          </div>
        )}

        <div className="flex flex-col">
          <label htmlFor="ttl" className="font-medium">
            TTL
          </label>
          <select name="ttl" id="ttl" className="border p-2 rounded" required>
            <option value="">-- Odaberi tip --</option>
            <option value="1">1 Hour</option>
            <option value="24">24 Hours</option>
            <option value="168">1 Week</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
        >
          Dodaj zapis
        </button>
        <button
          onClick={onCancel}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Odustani
        </button>
      </Form>
    </div>
  );
}
