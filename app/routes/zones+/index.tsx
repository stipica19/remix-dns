import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import {
  Form,
  Link,
  Outlet,
  redirect,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import ConfirmDeleteModal from "~/components/ConfirmDeleteModal";
import PaymentModal from "~/components/PaymentModal";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { db } from "~/services/db.server";
import { requireUser, requireVerifiedUser } from "~/utils/session.server";

interface Zone {
  id: number;
  name: string;
  user_id: number;
  disabled: boolean;
  created_at: string | Date;
  is_active: number; // 0 or 1
}

type Package = {
  id: number;
  name: string;
  price_monthly: number;
  price_yearly: number;
  description: string;
  package_type: string;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireVerifiedUser(request);

  const zones = await db.zones.findMany({
    where: {
      user_id: user.id,
    },
    orderBy: { created_at: "desc" },
    include: {
      zone_package: {
        include: {
          order_items: {
            select: {
              valid_until: true,
            },
          },
        },
      },
    },
  });

  const packages = await db.packages.findMany({
    where: { package_type: "server" },
    orderBy: { price_monthly: "asc" },
  });

  return json({ zones, packages, user });
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

  const deleteZoneId = form.get("deleteZoneId");
  if (deleteZoneId) {
    const id = Number(deleteZoneId);
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

  const newZone = await db.zones.create({
    data: {
      name: zoneName.trim(),
      user_id: user.id,
      disabled: false,
      is_active: 0,
      created_at: new Date(),
    },
  });
  // Automatski dodaj NS zapise
  await db.records.createMany({
    data: [
      {
        name: "@",
        type: 2,
        ttl: 3600,
        data: "ns1.dinio.com.",
        zone_id: newZone.id,
        user_id: user.id,
        created_at: new Date(),
      },
      {
        name: "@",
        type: 2,
        ttl: 3600,
        data: "ns2.dinio.com.",
        zone_id: newZone.id,
        user_id: user.id,
        created_at: new Date(),
      },
    ],
  });

  return json({ success: true, zoneId: newZone.id });
};

export default function Zones() {
  const { zones, user, packages } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [zoneToDelete, setZoneToDelete] = useState<number | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
  const [editedZoneName, setEditedZoneName] = useState("");
  const [lastCreatedZoneId, setLastCreatedZoneId] = useState<number | null>(
    null
  );
  const [showPackageModal, setShowPackageModal] = useState(false);

  useEffect(() => {
    if (actionData?.zoneId) {
      setLastCreatedZoneId(actionData.zoneId);
      setShowPackageModal(true);
    }
  }, [actionData]);

  console.log(zones);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tvoje Zone</h1>
      {actionData?.error && (
        <div className="text-red-500 bg-red-100 p-2 rounded">
          {actionData.error}
        </div>
      )}
      <Form method="post" className="flex space-x-2 items-center">
        <Input
          type="text"
          name="zoneName"
          placeholder="Nova zona (npr. example.com)"
          className="border p-2 rounded w-full max-w-sm"
        />
        <Button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Dodaj
        </Button>
      </Form>

      {showPackageModal && lastCreatedZoneId && (
        <PaymentModal
          isOpen={true}
          onClose={() => setShowPackageModal(false)}
          userId={user.id}
          zoneId={lastCreatedZoneId}
          packages={packages} // šalješ cijelu listu paketa
        />
      )}
      <div className="overflow-x-auto">
        <Table className="w-full table-auto border-collapse border border-gray-300 mt-4">
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="border p-2 text-left">Naziv zone</TableHead>
              <TableHead className="border p-2 text-left">Kreirana</TableHead>
              <TableHead className="border p-2 text-left">Status</TableHead>
              <TableHead className="border p-2 text-center w-20 whitespace-nowrap">
                Edit
              </TableHead>
              <TableHead className="border p-2 text-center w-20 whitespace-nowrap">
                Delete
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length > 0 ? (
              zones.map((zone: Zone) => {
                const validUntil =
                  zone.zone_package[0]?.order_items?.valid_until;

                return (
                  <TableRow key={zone.id} className="hover:bg-gray-50">
                    <TableHead className="border p-2">
                      {editingZoneId === zone.id ? (
                        <Input
                          type="text"
                          value={editedZoneName}
                          onChange={(e) => setEditedZoneName(e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      ) : zone.is_active ? (
                        <Link
                          to={`/zones/${zone.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {zone.name}
                        </Link>
                      ) : (
                        <span>{zone.name}</span>
                      )}
                    </TableHead>
                    <TableHead className="border p-2">
                      {new Date(zone.created_at).toLocaleDateString()}
                    </TableHead>
                    <TableHead className="border p-2">
                      {zone.is_active && validUntil ? (
                        <span className="text-green-600 font-medium">
                          Aktivna do {new Date(validUntil).toLocaleDateString()}
                        </span>
                      ) : (
                        <Button
                          onClick={() => {
                            setLastCreatedZoneId(zone.id);
                            setShowPackageModal(true);
                          }}
                          className="text-white bg-slate-700  hover:text-white-800 text-sm"
                        >
                          Aktiviraj / Plati
                        </Button>
                      )}
                    </TableHead>
                    <TableHead className="border p-2 text-center w-1">
                      {editingZoneId === zone.id ? (
                        <>
                          <Form
                            method="post"
                            className="inline"
                            onSubmit={() => setEditingZoneId(null)}
                          >
                            <Input
                              type="hidden"
                              name="editZoneId"
                              value={zone.id}
                            />
                            <Input
                              type="hidden"
                              name="editZoneName"
                              value={editedZoneName}
                            />

                            <Button
                              type="submit"
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm w-20"
                            >
                              Spremi
                            </Button>
                          </Form>
                          <Button
                            onClick={() => {
                              setEditingZoneId(null);
                              setEditedZoneName("");
                            }}
                            className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400 text-sm w-20"
                          >
                            Odustani
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => {
                            setEditingZoneId(zone.id);
                            setEditedZoneName(zone.name);
                          }}
                          className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm w-20 text-center"
                        >
                          Edit
                        </Button>
                      )}
                    </TableHead>
                    <TableHead className="border p-2 text-center w-1">
                      <Button
                        onClick={() => setZoneToDelete(zone.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm w-20 text-center"
                        type="button"
                      >
                        Delete
                      </Button>
                    </TableHead>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableHead
                  colSpan={3}
                  className="border p-2 text-center text-gray-500"
                >
                  Nema zona za prikaz.
                </TableHead>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
