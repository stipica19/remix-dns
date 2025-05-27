import { Form } from "@remix-run/react";

export default function AddForwardingForm({
  onCancel,
  zone,
}: {
  onCancel: () => void;
  zone: any;
}) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold">Dodaj Forwarding</h2>
      <Form method="post" className="space-y-4 mt-4 max-w-sm">
        <input type="hidden" name="formType" value="forwarding" />

        <div className="flex flex-col">
          <label htmlFor="subdomain">Subdomain</label>
          <div className="flex items-center border rounded overflow-hidden">
            <input
              type="text"
              name="subdomain"
              id="subdomain"
              className="p-2 w-full"
              placeholder="npr. www"
              required
            />
            <span className="bg-gray-100 px-2 text-sm text-gray-700">
              .{zone.name}
            </span>
          </div>
        </div>
        {/* HTTP / HTTPS + target URL */}
        <div className="flex flex-col">
          <label className="font-medium">Forward to</label>
          <div className="flex items-center space-x-2">
            <select name="protocol" className="border p-2 rounded" required>
              <option value="https">https://</option>
              <option value="http">http://</option>
            </select>
            <input
              type="text"
              name="targetUrl"
              placeholder="example.com"
              className="border p-2 rounded w-full"
              required
            />
          </div>
        </div>
        <div className="flex flex-col">
          <label className="font-medium mb-1">Vrsta redirekcije</label>
          <div className="space-y-1">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="redirectType"
                value="permanent_301"
                required
              />
              <span>Permanent (301)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name="redirectType" value="temporary_302" />
              <span>Temporary (302)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="radio" name="redirectType" value="masking" />
              <span>Custom</span>
            </label>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Dodaj Forwarding
          </button>
          <button
            onClick={onCancel}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Odustani
          </button>
        </div>
      </Form>
    </div>
  );
}
