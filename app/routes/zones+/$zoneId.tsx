import { Prisma, ForwardingForwardType } from "@prisma/client";
import { ActionFunction, LoaderFunction } from "@remix-run/node";
import {
  Form,
  json,
  redirect,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { useState } from "react";
import AddForwarding from "~/components/AddForwarding";
import AddRecord from "~/components/AddRecord";
import ConfirmDeleteModal from "~/components/ConfirmDeleteModal";
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
        forward_type: redirectType as ForwardingForwardType,
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
  const actionData = useActionData<typeof action>();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { zone, records } = useLoaderData<typeof loader>();

  const filteredRecords = records.filter((record: any) => {
    const query = searchTerm.toLowerCase();
    return (
      record.name?.toLowerCase().includes(query) ||
      record.data?.toLowerCase().includes(query) ||
      recordTypeMap[record.type]?.toLowerCase().includes(query)
    );
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        DNS zapisi za zonu <span> {zone.name}</span>
      </h1>

      <div className="flex items-center space-x-10 mb-4">
        <button
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
        </button>

        <button
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
        </button>
        <input
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
      {filteredRecords.length === 0 ? (
        <p className="text-gray-600"> Ova zona trenutno nema zapisa.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Type</th>
                <th className="border p-2 text-left">Data / Value</th>
                <th className="border p-2 text-left">TTL</th>

                <th className="border p-2 text-center w-20 whitespace-nowrap">
                  Edit
                </th>
                <th className="border p-2 text-center w-20 whitespace-nowrap">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record: any) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="border p-2">{record.name}</td>
                  <td className="border p-2">
                    {recordTypeMap[record.type] || record.type}
                  </td>
                  <td className="border p-2">{record.data}</td>
                  <td className="border p-2">{record.ttl}</td>
                  <td>
                    <button className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm w-20 text-center">
                      Edit
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => setRecordToDelete(record.id)}
                      className="bg-red-400 text-white px-3 py-1 rounded hover:bg-red-500 text-sm w-20 text-center"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
