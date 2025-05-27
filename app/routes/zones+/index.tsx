import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import {
  data,
  Form,
  Link,
  Outlet,
  redirect,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { useState } from "react";
import ConfirmDeleteModal from "~/components/ConfirmDeleteModal";
import { db } from "~/services/db.server";
import { requireUser, requireVerifiedUser } from "~/utils/session.server";

interface Zone {
  id: number;
  name: string;
  user_id: number;
  disabled: boolean;
  created_at: string | Date;
}

interface ZonesTableProps {
  zones: Zone[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireVerifiedUser(request);

  const zones = await db.zones.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
  });

  return json({ zones, user });
};

export const action: ActionFunction = async ({ request }) => {
  const user = await requireUser(request);
  const form = await request.formData();

  const editZoneId = form.get("editZoneId");
  const editZoneName = form.get("editZoneName");

  if (editZoneId && editZoneName && typeof editZoneName === "string") {
    const id = Number(editZoneId);
    await db.zones.updateMany({
      where: {
        id,
        user_id: user.id,
      },
      data: {
        name: editZoneName.trim(),
        updated_at: new Date(),
      },
    });
    return redirect("/zones");
  }
  // ✅ Ako dolazi iz forme za brisanje
  const deleteZoneId = form.get("deleteZoneId");
  if (deleteZoneId) {
    const id = Number(deleteZoneId);

    // sigurnosna provjera
    if (!isNaN(id)) {
      await db.zones.deleteMany({
        where: {
          id,
          user_id: user.id,
        },
      });
    }

    return redirect("/zones");
  }

  // ✅ Ako dolazi iz forme za dodavanje
  const zoneName = form.get("zoneName");

  if (
    !zoneName ||
    typeof zoneName !== "string" ||
    zoneName.trim().length === 0
  ) {
    return json({ error: "Naziv zone je obavezan." }, { status: 400 });
  }

  const existingZone = await db.zones.findFirst({
    where: {
      name: zoneName.trim(),
      user_id: user.id,
    },
  });

  if (existingZone) {
    return json({ error: "Zona s tim imenom već postoji." }, { status: 400 });
  }

  await db.zones.create({
    data: {
      name: zoneName.trim(),
      user_id: user.id,
      disabled: false,
      created_at: new Date(),
    },
  });

  return redirect("/zones");
};

export default function Zones() {
  const { zones } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [zoneToDelete, setZoneToDelete] = useState<number | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editedZoneName, setEditedZoneName] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tvoje Zone</h1>
      {actionData?.error && (
        <div className="text-red-500 bg-red-100 p-2 rounded">
          {actionData.error}
        </div>
      )}
      <Form method="post" className="flex space-x-2 items-center">
        <input
          type="text"
          name="zoneName"
          placeholder="Nova zona (npr. example.com)"
          className="border p-2 rounded w-full max-w-sm"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Dodaj
        </button>
      </Form>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-gray-300 mt-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Naziv zone</th>
              <th className="border p-2 text-left">Kreirana</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-center w-20 whitespace-nowrap">
                Edit
              </th>
              <th className="border p-2 text-center w-20 whitespace-nowrap">
                Delete
              </th>
            </tr>
          </thead>
          <tbody>
            {zones.length > 0 ? (
              zones.map((zone: Zone) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="border p-2">
                    {editingZoneId === zone.id ? (
                      <input
                        type="text"
                        value={editedZoneName}
                        onChange={(e) => setEditedZoneName(e.target.value)}
                        className="border p-1 rounded w-full"
                      />
                    ) : (
                      <Link
                        to={`/zones/${zone.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {zone.name}
                      </Link>
                    )}
                  </td>
                  <td className="border p-2">
                    {new Date(zone.created_at).toLocaleDateString()}
                  </td>
                  <td className="border p-2">
                    {zone.disabled ? "Onemogućena" : "Aktivna"}
                  </td>

                  <td className="border p-2 text-center w-1">
                    {editingZoneId === zone.id ? (
                      <>
                        <Form
                          method="post"
                          className="inline"
                          onSubmit={() => setEditingZoneId(null)}
                        >
                          <input
                            type="hidden"
                            name="editZoneId"
                            value={zone.id}
                          />
                          <input
                            type="hidden"
                            name="editZoneName"
                            value={editedZoneName}
                          />
                          <button
                            type="submit"
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm w-20"
                          >
                            Spremi
                          </button>
                        </Form>
                        <button
                          onClick={() => {
                            setEditingZoneId(null);
                            setEditedZoneName("");
                          }}
                          className=" bg-gray-300 px-3 py-1 rounded hover:bg-gray-400 text-sm w-20"
                        >
                          Odustani
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingZoneId(zone.id);
                          setEditedZoneName(zone.name);
                        }}
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm w-20 text-center"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                  <td className="border p-2 text-center w-1">
                    <button
                      onClick={() => setZoneToDelete(zone.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm w-20 text-center"
                      type="button"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="border p-2 text-center text-gray-500"
                >
                  Nema zona za prikaz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {zoneToDelete !== null && (
        <ConfirmDeleteModal
          title="Potvrda brisanja"
          visible={zoneToDelete !== null}
          onCancel={() => setZoneToDelete(null)}
          onConfirmSubmit={() => setZoneToDelete(null)}
          itemId={zoneToDelete}
          message="Jesi siguran da zelis obrisati ovaj zapis"
          inputName="deleteZoneId"
        />
      )}
      <Outlet />
    </div>
  );
}
