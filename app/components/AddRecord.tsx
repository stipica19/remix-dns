import { Form } from "@remix-run/react";
import { useState } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function AddRecord({ onCancel }: { onCancel: () => void }) {
  const [type, setType] = useState("");

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mt-8">Dodaj novi DNS zapis</h2>
      <Form
        method="post"
        className="mt-4 flex flex-row flex-wrap gap-4 items-end"
      >
        <div className="flex flex-col w-40">
          <Label htmlFor="name" className="font-medium">
            Name
          </Label>
          <Input
            type="text"
            name="name"
            id="name"
            className="border p-2 rounded"
            required
          />
        </div>

        <div className="flex flex-col w-40">
          <Label htmlFor="type" className="font-medium">
            Type
          </Label>
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
            <option value="2">NS</option>
          </select>
        </div>

        <div className="flex flex-col w-40">
          <Label htmlFor="data" className="font-medium">
            Data
          </Label>
          <Input
            type="text"
            name="data"
            id="data"
            className="border p-2 rounded"
            required
          />
        </div>

        {type === "15" && (
          <div className="flex flex-col w-40">
            <Label htmlFor="priority" className="font-medium">
              Priority
            </Label>
            <Input
              type="number"
              name="priority"
              id="priority"
              className="border p-2 rounded"
              required
            />
          </div>
        )}

        <div className="flex flex-col w-40">
          <Label htmlFor="ttl" className="font-medium">
            TTL
          </Label>
          <select name="ttl" id="ttl" className="border p-2 rounded" required>
            <option value="">-- Odaberi tip --</option>
            <option value="1">1 Hour</option>
            <option value="24">24 Hours</option>
            <option value="168">1 Week</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Dodaj zapis
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Odustani
          </Button>
        </div>
      </Form>
    </div>
  );
}
