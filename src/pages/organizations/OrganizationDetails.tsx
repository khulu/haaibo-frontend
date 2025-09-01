import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrganizationsApi, { Organization } from "../../hooks/api/useOrganizations";

export default function OrganizationDetails() {
  const { id } = useParams<{ id: string }>();
  const { getOrganizationById, deleteOrganization } = useOrganizationsApi();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getOrganizationById(id);
        setOrg(data);
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

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this organization?")) return;
    try {
      await deleteOrganization(id);
      navigate("/organizations");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError((err as { message?: string }).message || "Failed to delete organization");
      } else {
        setError("Failed to delete organization");
      }
    }
  };

  if (loading) return <div className="p-6">Loading organization...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!org) return <div className="p-6">Organization not found.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Organization Details</h1>
      <div className="mb-2"><b>Name:</b> {org.name}</div>
      <div className="mb-2"><b>Logo:</b> {org.logo ? <img src={org.logo} alt={org.name} className="h-8 inline" /> : "-"}</div>
      <div className="mb-2"><b>Primary Color:</b> {org.primaryColor || "-"}</div>
      <div className="mb-2"><b>Secondary Color:</b> {org.secondaryColor || "-"}</div>
      <div className="mb-2"><b>Admin User:</b> {org.adminUserName || org.adminUserId || "-"}</div>
      <div className="flex gap-4 mt-6">
        <button onClick={() => navigate(`/organizations/edit/${org.id}`)} className="px-4 py-2 bg-blue-600 text-white rounded">Edit</button>
        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
        <button onClick={() => navigate("/organizations")} className="px-4 py-2 bg-gray-300 text-gray-800 rounded">Back</button>
      </div>
    </div>
  );
}
