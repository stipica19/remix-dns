import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { DNSRecord } from "~/types/record";
import { Button } from "../ui/button";
import { Form, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";

interface EditNameServersDialogProps {
  nsRecords: DNSRecord[];
}

type FetcherData = { success?: boolean };

export default function EditNameServersDialog({
  nsRecords,
}: EditNameServersDialogProps) {
  const fetcher = useFetcher<FetcherData>();
  const [open, setOpen] = useState(false);

  // automatski zatvori kad je sve prošlo
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setOpen(false);
    }
  }, [fetcher.state, fetcher.data]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
            🌐 Name Servers
          </h2>
        </div>

        {/* NS Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">
              Primary NS
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {nsRecords[0]?.data || "N/A"}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">
              Secondary NS
            </p>
            <p className="text-lg font-semibold text-gray-800">
              {nsRecords[1]?.data || "N/A"}
            </p>
          </div>
        </div>

        {/* Trigger dugme */}
        <DialogTrigger asChild>
          <Button className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2">
            <span>⚙️</span> Edit Name Servers
          </Button>
        </DialogTrigger>
      </div>

      {/* Modal sadržaj */}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Name Servers</DialogTitle>
          <DialogDescription>
            Configure the authoritative name servers for your domain.
          </DialogDescription>
        </DialogHeader>

        {/* Remix Form */}
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="update-ns" />
          <input type="hidden" name="primary_id" value={nsRecords[0]?.id} />
          <input type="hidden" name="secondary_id" value={nsRecords[1]?.id} />

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Primary Name Server</label>
              <input
                name="primary_ns"
                defaultValue={nsRecords[0]?.data || ""}
                className="w-full mt-1 px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Secondary Name Server
              </label>
              <input
                name="secondary_ns"
                defaultValue={nsRecords[1]?.data || ""}
                className="w-full mt-1 px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={fetcher.state === "submitting"}>
              {fetcher.state === "submitting" ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
