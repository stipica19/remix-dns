import { Prisma, forwarding_forward_type } from "@prisma/client";
import { ActionFunction, LoaderFunction } from "@remix-run/node";
import {
  Form,
  json,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { useState } from "react";
import AddForwarding from "~/components/AddForwarding";
import AddRecord from "~/components/AddRecord";
import ConfirmDeleteModal from "~/components/ConfirmDeleteModal";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { db } from "~/services/db.server";
import { concate_rdata } from "~/utils/dns";
import { requireUser } from "~/utils/session.server";

const recordTypeMap: Record<number, string> = {
  1: "A",
  2: "NS",
  5: "CNAME",
  6: "SOA",
  15: "MX",
  16: "TXT",
  28: "AAAA",
};

//  Loader koji štiti pristup i vraća zonu + njene recordse
export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  const zoneId = Number(params.zoneId);

  if (isNaN(zoneId)) {
    throw new Response("Neispravan ID zone", { status: 400 });
  }

  // ✅ Pronađi zonu koja pripada logiranom korisniku
  const zone = await db.zones.findFirst({
    where: {
      id: zoneId,
      user_id: user.id,
    },
  });

  if (!zone) {
    throw new Response("Zona nije pronađena", { status: 404 });
  }

  // ✅ Dohvati sve records povezane sa zonom
  const records = await db.records.findMany({
    where: {
      zone_id: zoneId,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log("Recordi" + records[2]?.type);

  return json({ zone, records });
};

export const action: ActionFunction = async ({ request, params }) => {
  const user = await requireUser(request);
  const zoneId = Number(params.zoneId);

  if (isNaN(zoneId)) {
    return json({ error: "Neispravan ID zone" }, { status: 400 });
  }

  const formData = await request.formData();
  const formType = formData.get("formType");

  const zone = await db.zones.findFirst({
    where: {
      id: zoneId,
      user_id: user.id,
    },
  });

  if (!zone) {
    return json(
      { error: "Zona nije pronađena ili ne pripada korisniku." },
      { status: 403 }
    );
  }

  // ✅ DELETE zapis
  const deleteRecordId = formData.get("deleteRecordId");
  if (deleteRecordId) {
    const recordId = Number(deleteRecordId);
    if (isNaN(recordId)) {
      return json({ error: "Neispravan ID zapisa." }, { status: 400 });
    }

    const record = await db.records.findFirst({
      where: {
        id: recordId,
        zone_id: zoneId,
      },
    });

    if (!record) {
      return json({ error: "Zapis nije pronađen." }, { status: 404 });
    }

    await db.records.delete({
      where: {
        id: recordId,
      },
    });

    return redirect(`/zones/${zoneId}`);
  }

  if (formType === "edit-record") {
    const recordId = Number(formData.get("recordId"));
    const name = formData.get("name") as string;
    const type = Number(formData.get("type"));
    const data = formData.get("data") as string;
    const ttl = Number(formData.get("ttl")) * 3600;
    const priority = Number(formData.get("priority") || "0");

    if (type === 2) {
      const nsRecords = await db.records.findMany({
        where: {
          zone_id: zoneId,
          type: 2,
        },
      });

      const defaultNS = ["ns1.example.com.", "ns2.example.com."]; // <-- tvoji defaultni

      const koristiCustomNS = nsRecords.every(
        (ns) => !defaultNS.includes(ns.data)
      );

      if (koristiCustomNS) {
        // Disable-uj sve osim NS zapisa
        await db.records.updateMany({
          where: {
            zone_id: zoneId,
            type: { not: 2 }, // sve osim NS
          },
          data: {
            disabled: 1,
          },
        });
      }
    }

    await db.records.update({
      where: { id: recordId, zone_id: zoneId },
      data: {
        name,
        type,
        data,
        ttl,
      },
    });

    return redirect(`/zones/${zoneId}`);
  }

  // ✅ ADD FORWARDING zapis (CNAME)
  if (formType === "forwarding") {
    console.log("Forwarding form submitted");
    const subdomain = formData.get("subdomain") as string;
    const targetUrl = formData.get("targetUrl") as string;
    const protocol = formData.get("protocol") as string;

    const redirectType = formData.get("redirectType");

    if (!subdomain || !targetUrl || !protocol || !redirectType) {
      return json(
        { error: "Sva forwarding polja su obavezna." },
        { status: 400 }
      );
    }

    let name = subdomain + "." + zone.name + ".";
    let data = `${protocol}://${targetUrl}`;

    if (!data.endsWith(".")) {
      data += ".";
    }

    // Možeš ovdje sačuvati `redirectType` u `data` ili posebno u bazi
    // Ovdje ga samo logujemo
    console.log("Redirect Type:", redirectType);

    const createdRecord = await db.records.create({
      data: {
        name,
        type: 5, // CNAME
        data,
        ttl: 3600,
        zone_id: zoneId,
      },
    });

    await db.forwarding.create({
      data: {
        record_id: createdRecord.id,
        destination_url: data, // ili targetUrl ako ti je čišće
        forward_type: redirectType as forwarding_forward_type,
        disabled: false,
      },
    });

    return redirect(`/zones/${zoneId}`);
  }

  // ✅ ADD regular DNS zapis
  let nameInput = formData.get("name") as string;
  let type = Number(formData.get("type"));
  let value = formData.get("data") as string;
  let ttl = Number(formData.get("ttl")) * 3600;
  let priority = Number(formData.get("priority"));

  if (!nameInput || !type || !value || isNaN(ttl)) {
    return json({ error: "Sva polja su obavezna." }, { status: 400 });
  }

  const existingRecord = await db.records.findFirst({
    where: {
      name: nameInput,
      type,
      data: value,
      zone_id: zoneId,
    },
  });
  if (existingRecord) {
    return json(
      { error: "Zapis sa istim vrijednostima već postoji." },
      { status: 409 }
    );
  }

  const concatInput = {
    type: recordTypeMap[type],
    value,
    priority,
  };

  let data = concate_rdata(concatInput);

  let name = nameInput;

  if (name === "@" && type === 1) {
    name = zone.name + ".";
  }
  if (type === 5) {
    name += ".";
  }
  if (name === "www" && type === 1) {
    name = "www." + zone.name + ".";
  }
  if (
    ["NS", "CNAME", "MX"].includes(recordTypeMap[type]) &&
    !data.endsWith(".")
  ) {
    data += ".";
  }

  console.log("tttttttt", ttl);

  await db.records.create({
    data: {
      name,
      type,
      data,
      ttl,
      zone_id: zoneId,
    },
  });

  return redirect(`/zones/${zoneId}`);
};

export default function ZoneDetails() {
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [activeForm, setActiveForm] = useState<"record" | "forwarding" | null>(
    null
  );
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [routingPolicy, setRoutingPolicy] = useState<boolean>(false);

  const fetcher = useFetcher();

  const actionData = useActionData<typeof action>();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { zone, records } = useLoaderData<typeof loader>();

  console.log("Recordi " + records[2]?.type);

  const countAorAAAA = records.some((record) => {
    if (record.type === 1 || record.type === 28) {
      const count = records.filter(
        (r) => r.name === record.name && (r.type === 1 || r.type === 28)
      ).length;
      return count >= 2;
    }
    return false;
  });

  const filteredRecords = records.filter((record: any) => {
    const query = searchTerm.toLowerCase();
    return (
      record.name?.toLowerCase().includes(query) ||
      record.data?.toLowerCase().includes(query) ||
      recordTypeMap[record.type]?.toLowerCase().includes(query)
    );
  });

  const handleSave = async (recordId: number) => {
    const formData = new FormData();
    formData.append("formType", "edit-record");
    formData.append("recordId", recordId.toString());
    formData.append("name", editFormData.name);
    formData.append("type", editFormData.type);
    formData.append("data", editFormData.data);
    formData.append("ttl", editFormData.ttl);
    formData.append("priority", editFormData.priority || "0");

    fetcher.submit(formData, {
      method: "post",
      action: window.location.pathname,
    });

    setEditingRecordId(null); // ili refetch loader ako koristiš loader sveže
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        DNS zapisi za zonu <span> {zone.name}</span>
      </h1>

      <div className="flex items-center space-x-10 mb-4">
        <Button
          className="bg-gray-500 hover:bg-gray-400 p-2 text-white rounded flex items-center space-x-2"
          onClick={() =>
            setActiveForm((prev) => (prev === "record" ? null : "record"))
          }
        >
          {/* SVG ikona npr. plus */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add new Record</span>
        </Button>

        <Button
          className="bg-blue-500 hover:bg-blue-400 p-2 text-white rounded flex items-center space-x-2"
          onClick={() =>
            setActiveForm((prev) =>
              prev === "forwarding" ? null : "forwarding"
            )
          }
        >
          {/* Druga SVG ikona npr. link (za forwarding) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add new Forwarding</span>
        </Button>

        <Button
          className="bg-blue-500 hover:bg-blue-400 p-2 text-white rounded flex items-center space-x-2"
          onClick={() => setRoutingPolicy((prev) => !prev)}
          disabled={!countAorAAAA}
        >
          <span>Routing policy</span>
        </Button>

        <Input
          className="w-64 bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md p-2.5  transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
          placeholder="Search..."
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
      </div>
      {actionData?.error && (
        <p className="text-red-600 font-medium bg-red-100 p-2 rounded">
          ⚠ {actionData.error}
        </p>
      )}
      {activeForm === "record" && (
        <AddRecord onCancel={() => setActiveForm(null)} />
      )}
      {activeForm === "forwarding" && (
        <div className="mt-8">
          <AddForwarding onCancel={() => setActiveForm(null)} zone={zone} />
        </div>
      )}
      {filteredRecords.lengTableHead === 0 ? (
        <p className="text-gray-600"> Ova zona trenutno nema zapisa.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full table-auto border-collapse border border-gray-300">
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="border p-2 text-left">Name</TableHead>
                <TableHead className="border p-2 text-left">Type</TableHead>
                <TableHead className="border p-2 text-left">
                  Data / Value
                </TableHead>
                <TableHead className="border p-2 text-left">TTL</TableHead>

                <TableHead className="border p-2 text-center w-20 whitespace-nowrap">
                  Edit
                </TableHead>
                <TableHead className="border p-2 text-center w-20 whitespace-nowrap">
                  Delete
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record: any) => (
                <TableRow
                  key={record.id}
                  className={`hover:bg-gray-50 ${
                    record.disabled
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {editingRecordId === record.id ? (
                    <>
                      <TableHead className="border p-2">
                        <Input
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              name: e.target.value,
                            })
                          }
                          className="border p-1 rounded w-full"
                        />
                      </TableHead>
                      <TableHead className="border p-2">
                        <select
                          value={editFormData.type}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              type: e.target.value,
                            })
                          }
                          className="border p-1 rounded w-full"
                        >
                          <option value="1">A</option>
                          <option value="28">AAAA</option>
                          <option value="5">CNAME</option>
                          <option value="15">MX</option>
                          <option value="2">NS</option>
                        </select>
                      </TableHead>
                      <TableHead className="border p-2">
                        <Input
                          value={editFormData.data}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              data: e.target.value,
                            })
                          }
                          className="border p-1 rounded w-full"
                        />
                      </TableHead>
                      <TableHead className="border p-2">
                        <Input
                          type="number"
                          value={editFormData.ttl}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              ttl: e.target.value,
                            })
                          }
                          className="border p-1 rounded w-full"
                        />
                      </TableHead>
                      <TableHead className="border p-2 flex gap-2 justify-center">
                        <Button
                          onClick={() => handleSave(record.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingRecordId(null)}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Cancel
                        </Button>
                      </TableHead>
                      <TableHead></TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="border p-2 text-black">
                        {routingPolicy &&
                          (record.type === 1 || record.type === 28) && (
                            <Checkbox />
                          )}{" "}
                        {record.name}
                      </TableHead>
                      <TableHead className="border p-2 text-black">
                        {recordTypeMap[record.type] || record.type}
                      </TableHead>
                      <TableHead className="border p-2 text-black">
                        {record.data}
                      </TableHead>
                      <TableHead className="border p-2 text-black">
                        {record.ttl}
                      </TableHead>
                      <TableHead className="border p-2 text-center ">
                        <Button
                          disabled={record.disabled}
                          className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm"
                          onClick={() => {
                            setEditingRecordId(record.id);
                            setEditFormData({
                              name: record.name,
                              type: String(record.type),
                              data: record.data,
                              ttl: String(record.ttl / 3600),
                              priority: record.priority || "",
                            });
                          }}
                        >
                          Edit
                        </Button>
                      </TableHead>
                      <TableHead className="border p-2 text-center">
                        <Button
                          disabled={record.disabled}
                          onClick={() => setRecordToDelete(record.id)}
                          className="bg-red-400 text-white px-3 py-1 rounded hover:bg-red-500 text-sm"
                        >
                          Delete
                        </Button>
                      </TableHead>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {recordToDelete !== null && (
        <ConfirmDeleteModal
          title="Potvrda brisanja"
          visible={recordToDelete !== null}
          onCancel={() => setRecordToDelete(null)}
          onConfirmSubmit={() => setRecordToDelete(null)}
          itemId={recordToDelete}
          message="Jesi siguran da zelis obrisati ovaj zapis"
          inputName="deleteRecordId"
        />
      )}
    </div>
  );
}
