import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useUserApi, { User } from "@hooks/api/useUserApi";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal/Modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Badge from "../../components/ui/badge/Badge";
import useUser from "@hooks/user/useUser";
import PhotoModal from "./PhotoModal";

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const { getUserById } = useUserApi();
  const { useRoles } = useUser();
  const { data: dataRoles } = useRoles();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, closeModal } = useModal();
  const navigate = useNavigate();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const { uploadProfilePicture } = useUserApi();

  const dropdownRoles = dataRoles?.map((role, index) => ({ value: index, text: role }));
  const [isSuperAdmin] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return false;
      const user = JSON.parse(raw);
      const role = user?.role;
      return role === 0 || role === 'SuperAdmin';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        const data = await getUserById(id);
        if (mounted) setUser(data);
      } catch (err) {
        if (mounted) {
          if (err instanceof Error) {
            setError(err.message || "Failed to fetch user");
          } else {
            setError("Failed to fetch user");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, getUserById]);

  const handlePhotoSelected = async (fileOrBlob: File | Blob) => {
    if (!user || !id) return;
    try {
      let file: File;
      if (fileOrBlob instanceof File) {
        file = fileOrBlob;
      } else {
        // Convert Blob from webcam to a File with a valid name and type
        file = new File([fileOrBlob], "webcam.jpg", { type: "image/jpeg" });
      }

      const maxBytes = 5 * 1024 * 1024;
      const allowedMime = ["image/jpeg", "image/png", "image/svg+xml"];
      const allowedExt = [".jpg", ".jpeg", ".png", ".svg"];
      const hasValidSize = file.size <= maxBytes;
      const nameLower = file.name.toLowerCase();
      const hasValidExt = allowedExt.some((ext) => nameLower.endsWith(ext));
      const hasValidType = allowedMime.includes(file.type);
      if (!hasValidSize || !hasValidExt || !hasValidType) {
        alert("Invalid file. Allowed: .jpg, .jpeg, .png, .svg. Max 5MB.");
        return;
      }

      await uploadProfilePicture(id, file);
      const updated = await getUserById(id);
      setUser(updated);
      setPhotoModalOpen(false);
    } catch {
      alert("Failed to upload photo");
    }
  };

  if (loading) return <div className="p-6">Loading user...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!user) return <div className="p-6">User not found.</div>;
  const role = dropdownRoles?.find((r) => r.value === user.role);
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 overflow-hidden rounded-full bg-gray-100 flex items-center justify-center cursor-pointer" onClick={() => setPhotoModalOpen(true)}>
            {user.profilePicture ? (
              (() => {
                const isProd = import.meta.env.ASPNETCORE_ENVIRONMENT === "Production";
                  const baseUrl = 'https://haiibo-backend-api.azurewebsites.net';
                  const p = user.profilePicture;
                const imgSrc = isProd
                  ? (/^https?:\/\//.test(p) ? p : `${baseUrl}${p}`)
                  : p;
                return (
                  <img
                    width={64}
                    height={64}
                    src={imgSrc}
                    alt={user.fullName}
                  />
                );
              })()
            ) : (
              <span className="text-gray-400 text-2xl font-bold">
                {user.fullName?.[0] || "?"}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {user.fullName}
            </h4>
            <Badge size="sm" color={role?.text.toString() === "SuperAdmin" ? "success" : "warning"}>
              {role?.text.toString()}
            </Badge>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            size="sm"
            onClick={() => navigate(`/users/edit/${id}`)}
          >
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/users")}>
            Back
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Personal Information
        </h4>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          <div>
            <Label>Email</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.email}
            </p>
          </div>
          <div>
            <Label>Phone</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.phone || "-"}
            </p>
          </div>
          <div>
            <Label>Department</Label>
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user.department || "-"}
            </p>
          </div>
          {isSuperAdmin && (
            <div>
              <Label>Company</Label>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.companyName || "-"}
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={user.email || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUser({ ...user, email: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <Label>Phone</Label>
                  <Input
                    type="text"
                    value={user.phone || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUser({ ...user, phone: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={() => console.log("Save changes")}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <PhotoModal isOpen={photoModalOpen} onClose={() => setPhotoModalOpen(false)} onPhotoSelected={handlePhotoSelected} />
    </div>
  );
}
