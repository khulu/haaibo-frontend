import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useOrganizationsApi, { CreateOrganizationInput } from "../../hooks/api/useOrganizationApi";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

export default function OrganizationCreate() {
  const { createOrganization } = useOrganizationsApi();
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateOrganizationInput>({
    name: "",
    adminUserId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createOrganization(form);
      navigate("/organizations");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message?: string }).message || "Failed to create organization");
      } else {
        setError("Failed to create organization");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentCard title="Create Organization">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="adminUserId">Admin User ID</Label>
          <Input
            id="adminUserId"
            name="adminUserId"
            value={form.adminUserId || ""}
            onChange={handleChange}
          />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
            onClick={() => navigate("/organizations")}
          >
            Cancel
          </button>
        </div>
      </form>
    </ComponentCard>
  );
}
