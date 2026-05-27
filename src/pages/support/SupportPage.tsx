import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";

// TODO: Integrate with a real support ticket API (e.g. POST /api/support/tickets).
// Currently uses a simulated timeout. Replace handleSubmit logic with actual API hook
// once the backend endpoint is available.

export default function SupportPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user info from localStorage
  const userData = localStorage.getItem("user");
  let user: any = null;
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (e) {
      console.error("Failed to parse user from localStorage:", e);
    }
  }

  const [formData, setFormData] = useState({
    name: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    subject: "",
    priority: "medium",
    category: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // TODO: Replace with actual API call to submit support ticket
      // const response = await fetch('/api/support/tickets', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     userId: user?.id,
      //     companyId: auth.getCompanyId(),
      //   }),
      // });

      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSuccess(true);
      // Reset form
      setFormData({
        name: user?.fullName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        subject: "",
        priority: "medium",
        category: "",
        description: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit support ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ComponentCard title="Submit Support Ticket">
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help? Fill out the form below and our support team will get back to you as soon as possible.
          </p>
        </div>

        {success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-900/10 dark:text-green-300">
            Your support ticket has been submitted successfully! We'll contact you shortly.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/10 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@company.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                options={[
                  { value: "", label: "Select a category" },
                  { value: "technical", label: "Technical Issue" },
                  { value: "billing", label: "Billing & Payments" },
                  { value: "account", label: "Account Management" },
                  { value: "feature", label: "Feature Request" },
                  { value: "bug", label: "Bug Report" },
                  { value: "other", label: "Other" },
                ]}
                defaultValue={formData.category}
                onChange={(value) => handleSelectChange("category", value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority *</Label>
              <Select
                options={[
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "urgent", label: "Urgent" },
                ]}
                defaultValue={formData.priority}
                onChange={(value) => handleSelectChange("priority", value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="Brief description of your issue"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Please provide detailed information about your issue or request..."
              rows={6}
              className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Other Ways to Get Help
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <strong className="text-gray-800 dark:text-white/90">Email Support</strong>
                <p className="text-gray-600 dark:text-gray-400">support@haiibo.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <strong className="text-gray-800 dark:text-white/90">Phone Support</strong>
                <p className="text-gray-600 dark:text-gray-400">+1 (800) 123-4567</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Mon-Fri, 9AM-5PM EST</p>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}
