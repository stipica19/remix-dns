import { Form } from "@remix-run/react";

type ConfirmDeleteModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirmSubmit: () => void;
  itemId: number | string;
  title?: string;
  message?: string;
  inputName?: string;
  formAction?: string;
};
export default function ConfirmDeleteModal({
  visible,
  onCancel,
  onConfirmSubmit,
  itemId,
  title,
  message,
  inputName,
}: ConfirmDeleteModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <p className="mb-4">{message}</p>

        <div className="flex justify-end space-x-2">
          <button
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            onClick={onCancel}
          >
            Odustani
          </button>

          <Form method="post" onSubmit={onConfirmSubmit}>
            <input type="hidden" name={inputName} value={itemId} />
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Da, obriši
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
