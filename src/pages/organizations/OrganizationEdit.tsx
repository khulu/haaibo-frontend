import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrganizationsApi, { Organization } from "../../hooks/api/useOrganizations";

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
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl border border-gray-200 dark:bg-white/[0.03] dark:border-white/[0.05]">
      <h1 className="text-2xl font-bold mb-4">Edit Organization</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={org.name || ""}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Admin User ID</label>
          <input
            type="text"
            name="adminUserId"
            value={org.adminUserId || ""}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
