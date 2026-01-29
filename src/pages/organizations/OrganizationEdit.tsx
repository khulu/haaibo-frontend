import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrganizationsApi, { Organization } from "../../hooks/api/useOrganizationApi";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import FileInput from "../../components/form/input/FileInput";
import Switch from "../../components/form/switch/Switch";

export default function OrganizationEdit() {
  const { id } = useParams<{ id: string }>();
    const { getOrganizationById, uploadLogo, updateBranding, updateSettings } = useOrganizationsApi();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string>("");
  const [secondaryColor, setSecondaryColor] = useState<string>("");
    const [enableOfficeReservations, setEnableOfficeReservations] = useState<boolean>(false);
    const [reservationMenuLabel, setReservationMenuLabel] = useState<string>("");
    const [reportingReservationsMenuLabel, setReportingReservationsMenuLabel] = useState<string>("");
    const [hotDeskLicences, setHotDeskLicences] = useState<number>(0);
  const [allowAssetTracking, setAllowAssetTracking] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoFile(file);
  };

  useEffect(() => {
    (async () => {
      try {
        if (id) {
          const data = await getOrganizationById(id);
          setOrg(data);
          setPrimaryColor(data.primaryColor ?? "");
          setSecondaryColor(data.secondaryColor ?? "");
          setEnableOfficeReservations(!!data.enableOfficeReservations);
          setReservationMenuLabel(data.reservationMenuLabel ?? "");
          setReportingReservationsMenuLabel(data.reportingReservationsMenuLabel ?? "");
          setHotDeskLicences(typeof data.hotDeskLicences === 'number' ? Math.max(0, data.hotDeskLicences || 0) : 0);
          setAllowAssetTracking(!!data.allowAssetTracking);
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
    // Note: getOrganizationById is a function from a hook and not stable across renders.
    // Depending on it causes the effect to re-run indefinitely.
    // We only depend on `id` here to avoid an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!org) return;
    setOrg({ ...org, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !id) return;
    setSaving(true);
    try {
      // Validation
      if (reservationMenuLabel && reservationMenuLabel.length > 100) {
        setError("Reservation Menu Item Label must be at most 100 characters");
        setSaving(false);
        return;
      }
      if (reportingReservationsMenuLabel && reportingReservationsMenuLabel.length > 100) {
        setError("Reporting Reservations Menu Label must be at most 100 characters");
        setSaving(false);
        return;
      }
      if (!Number.isInteger(hotDeskLicences) || hotDeskLicences < 0) {
        setError("Hot Desk Licences must be a non-negative integer");
        setSaving(false);
        return;
      }
      // Update basic org fields (name/adminUserId)
      // Update branding colors if provided
      try {
        await updateBranding(id, {
          primaryColor: primaryColor || undefined,
          secondaryColor: secondaryColor || undefined,
        });
      } catch (err) {
        console.warn('Branding update failed', err);
      }
      // Update settings
      try {
        await updateSettings(id, {
          enableOfficeReservations,
          reservationMenuLabel: reservationMenuLabel ? reservationMenuLabel : null,
          reportingReservationsMenuLabel: reportingReservationsMenuLabel ? reportingReservationsMenuLabel : null,
          hotDeskLicences,
          allowAssetTracking,
        });
      } catch (err) {
        console.warn('Settings update failed', err);
      }
      // Upload logo if selected
      if (logoFile) {
        try {
          await uploadLogo(id, logoFile);
        } catch (err) {
          console.warn('Logo upload failed', err);
        }
      }
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
          <Switch
            label="Allow Asset Tracking"
            defaultChecked={allowAssetTracking}
            onChange={(checked) => setAllowAssetTracking(checked)}
          />
        </div>
        <div>
          <Switch
            label="Enable Users to Reserve Office Space"
            defaultChecked={enableOfficeReservations}
            onChange={(checked) => setEnableOfficeReservations(checked)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reservationMenuLabel">Reservation Menu Item Label (optional, max 100)</Label>
            <Input
              id="reservationMenuLabel"
              name="reservationMenuLabel"
              value={reservationMenuLabel}
              onChange={(e) => setReservationMenuLabel(e.target.value)}
              hint="Defaults to 'Reservations' if empty"
              disabled={!enableOfficeReservations}
            />
          </div>
          <div>
            <Label htmlFor="hotDeskLicences">Hot Desk Licences (min 0)</Label>
            <Input
              id="hotDeskLicences"
              name="hotDeskLicences"
              type="number"
              value={hotDeskLicences}
              onChange={(e) => {
                const v = e.target.value;
                const num = v === "" ? 0 : parseInt(v, 10);
                setHotDeskLicences(Number.isNaN(num) ? 0 : Math.max(0, num));
              }}
              min="0"
              step={1}
              disabled={!enableOfficeReservations}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="reportingReservationsMenuLabel">Reporting Reservations Menu Label (optional, max 100)</Label>
          <Input
            id="reportingReservationsMenuLabel"
            name="reportingReservationsMenuLabel"
            value={reportingReservationsMenuLabel}
            onChange={(e) => setReportingReservationsMenuLabel(e.target.value)}
            hint="Shown as the label for Reporting → Reservations in the sidebar/top menu. Defaults to 'Reservations Report' if empty"
            disabled={!enableOfficeReservations}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Dark color (main design color)</Label>
            <input
              id="primaryColor"
              name="primaryColor"
              type="color"
              value={primaryColor || '#3D54E8'}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
          <div>
            <Label htmlFor="secondaryColor">Accent color (complementary - NOT WHITE)</Label>
            <input
              id="secondaryColor"
              name="secondaryColor"
              type="color"
              value={secondaryColor || '#000000'}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="logo">Logo (optional)</Label>
          <FileInput onChange={handleLogoChange} className="mt-1" />
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
