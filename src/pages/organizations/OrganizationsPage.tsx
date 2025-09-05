import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useOrganizationsApi, { Organization } from "../../hooks/api/useOrganization";

export default function OrganizationsPage() {
  const { getOrganizations, deleteOrganization } = useOrganizationsApi();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await getOrganizations();
        setOrganizations(data);
      } catch (err: unknown) {
        if (err && typeof err === "object" && "message" in err) {
          setError((err as { message?: string }).message || "Failed to fetch organizations");
        } else {
          setError("Failed to fetch organizations");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [getOrganizations]);

  if (loading) return <div className="p-6">Loading organizations...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Organizations</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => navigate("/organizations/create")}
        >
          Create Organization
        </button>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Logo</th>
              <th className="px-5 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id}>
                <td className="px-5 py-4">{org.name}</td>
                <td className="px-5 py-4">
                  {org.logo ? <img src={org.logo} alt={org.name} className="h-8" /> : "-"}
                </td>
                <td className="px-5 py-4">
                  <button className="px-2 py-1 bg-gray-200 text-gray-800 rounded mr-2" onClick={() => navigate(`/organizations/${org.id}`)}>View</button>
                  <button className="px-2 py-1 bg-blue-500 text-white rounded mr-2" onClick={() => navigate(`/organizations/edit/${org.id}`)}>Edit</button>
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    disabled={deletingId === org.id}
                    onClick={async () => {
                      if (!window.confirm("Are you sure you want to delete this organization?")) return;
                      setDeletingId(org.id);
                      try {
                        await deleteOrganization(org.id);
                        setOrganizations((prev) => prev.filter((o) => o.id !== org.id));
                      } catch (err: unknown) {
                        if (err && typeof err === "object" && "message" in err) {
                          setError((err as { message?: string }).message || "Failed to delete organization");
                        } else {
                          setError("Failed to delete organization");
                        }
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    {deletingId === org.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
