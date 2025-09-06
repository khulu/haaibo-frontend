import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrganizationsApi, { Organization } from "../../hooks/api/useOrganizationApi";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

export default function OrganizationEdit() {
  const { id } = useParams<{ id: string }>();
  const { getOrganizationById, updateOrganization } = useOrganizationsApi();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        if (id) {
          const data = await getOrganizationById(id);
          setOrg(data);
        }
      } catch (err: unknown) {
        if (err && typeof err === "object" && "message" in err) {
          setError((err as { message?: string }).message || "Failed to fetch organization");
        } else {
          setError("Failed to fetch organization");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getOrganizationById]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!org) return;
    setOrg({ ...org, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !id) return;
    setSaving(true);
    try {
      await updateOrganization(id, org);
      navigate("/organizations");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message?: string }).message || "Failed to update organization");
      } else {
        setError("Failed to update organization");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading organization...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!org) return <div className="p-6">Organization not found</div>;

  return (
    <ComponentCard title="Edit Organization">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={org.name || ""}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="adminUserId">Admin User ID</Label>
          <Input
            id="adminUserId"
            name="adminUserId"
            value={org.adminUserId || ""}
            onChange={handleChange}
          />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        <div className="flex gap-4">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
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
