import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/auth/PrivateRoute";
import RoleRoute from "./components/auth/RoleRoute";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { GlobalSpinner } from "./components/ui/spinner";
import Home from "./pages/Dashboard/Home";
// Lazy-loaded routes for performance
const Unauthorized = lazy(() => import("./pages/OtherPage/Unauthorized"));
const UsersPage = lazy(() => import("./pages/users/UsersPage"));
const UserDetails = lazy(() => import("./pages/users/UserDetails"));
const UserEdit = lazy(() => import("./pages/users/UserEdit"));
const UserCreate = lazy(() => import("./pages/users/UserCreate"));
const UserBulkUpload = lazy(() => import("./pages/users/UserBulkUpload"));
const SupportPage = lazy(() => import("./pages/support/SupportPage"));
const AssetsPage = lazy(() => import("./pages/assets/AssetsPage"));
const AssetCreate = lazy(() => import("./pages/assets/AssetCreate"));
const AssetDetails = lazy(() => import("./pages/assets/AssetDetails"));
const AssetEdit = lazy(() => import("./pages/assets/AssetEdit"));
const AssetBulkUpload = lazy(() => import("./pages/assets/AssetBulkUpload"));
const EventsPage = lazy(() => import("./pages/events/EventsPage"));
const CollectionsPage = lazy(() => import("./pages/collections/CollectionsPage"));
const CollectionsCreate = lazy(() => import("./pages/collections/CollectionsCreate"));
const CollectionsEdit = lazy(() => import("./pages/collections/CollectionsEdit"));
const CollectionDetails = lazy(() => import("./pages/collections/CollectionDetails"));
const TeamsPage = lazy(() => import("./pages/teams/TeamsPage"));
const TeamDetailPage = lazy(() => import("./pages/teams/TeamDetailPage"));
const AssetBookingsCreate = lazy(() => import("./pages/bookings/AssetBookingsCreate"));
const BookingsPage = lazy(() => import("./pages/bookings/BookingsPage"));
const LocationsPage = lazy(() => import("./pages/locations/LocationsPage"));
const LocationDetails = lazy(() => import("./pages/locations/LocationDetails"));
const ReservationsPage = lazy(() => import("./pages/reservations/ReservationsPage"));
const IssuesPage = lazy(() => import("./pages/issues/IssuesPage"));
const IssueDetails = lazy(() => import("./pages/issues/IssueDetails"));
const IssueCreate = lazy(() => import("./pages/issues/IssueCreate"));
const ContactsPage = lazy(() => import("./pages/contacts/ContactsPage"));
const ContactCreate = lazy(() => import("./pages/contacts/ContactCreate"));
const ContactEdit = lazy(() => import("./pages/contacts/ContactEdit"));
const ContactsBulkUpload = lazy(() => import("./pages/contacts/ContactsBulkUpload"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const ReservationReports = lazy(() => import("./pages/reservation_reports/ReservationReports"));
const ImportResources = lazy(() => import("./pages/reservation_reports/ImportResources"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const OrganizationsPage = lazy(() => import("./pages/organizations/OrganizationsPage"));
const OrganizationDetails = lazy(() => import("./pages/organizations/OrganizationDetails"));
const OrganizationCreate = lazy(() => import("./pages/organizations/OrganizationCreate"));
const OrganizationEdit = lazy(() => import("./pages/organizations/OrganizationEdit"));
const Calendar = lazy(() => import("./pages/Calendar"));
const BasicTables = lazy(() => import("./pages/Tables/BasicTables"));
const FormElements = lazy(() => import("./pages/Forms/FormElements"));
const Blank = lazy(() => import("./pages/Blank"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const ResetPassword = lazy(() => import("./pages/AuthPages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/AuthPages/ForgotPassword"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));
const PeakUsageHeatmap = lazy(() => import("./pages/reports/PeakUsageHeatmap"));
const CheckinPage = lazy(() => import('./pages/checkin/CheckinPage'));

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Suspense
          fallback={
            <GlobalSpinner
              show
              spinnerProps={{ size: 64, variant: "ring", colorClassName: "text-brand-500", ariaLabel: "Loading content" }}
            />
          }
        >
          <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route
              path="/unauthorized"
              element={
                <PrivateRoute>
                  <Unauthorized />
                </PrivateRoute>
              }
            />

            <Route
              index
              path="/"
              element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              }
            />

            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <UsersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/users/:id"
              element={
                <PrivateRoute>
                  <UserDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/users/edit/:id"
              element={
                <PrivateRoute>
                  <UserEdit />
                </PrivateRoute>
              }
            />
                        <Route
              path="/users/create"
              element={
                <PrivateRoute>
                  <UserCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/users/create-bulk"
              element={
                <PrivateRoute>
                  <UserBulkUpload />
                </PrivateRoute>
              }
            />
            <Route
              path="/support"
              element={
                <PrivateRoute>
                  <SupportPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <PrivateRoute>
                  <Calendar />
                </PrivateRoute>
              }
            />
            <Route
              path="/blank"
              element={
                <PrivateRoute>
                  <Blank />
                </PrivateRoute>
              }
            />
            <Route
              path="/form-elements"
              element={
                <PrivateRoute>
                  <FormElements />
                </PrivateRoute>
              }
            />
            <Route
              path="/basic-tables"
              element={
                <PrivateRoute>
                  <BasicTables />
                </PrivateRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <PrivateRoute>
                  <Alerts />
                </PrivateRoute>
              }
            />
            <Route
              element={
                <PrivateRoute>
                  <Avatars />
                </PrivateRoute>
              }
            />
            <Route
              path="/badge"
              element={
                <PrivateRoute>
                  <Badges />
                </PrivateRoute>
              }
            />
            <Route
              path="/buttons"
              element={
                <PrivateRoute>
                  <Buttons />
                </PrivateRoute>
              }
            />
            <Route
              path="/images"
              element={
                <PrivateRoute>
                  <Images />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <NotificationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/videos"
              element={
                <PrivateRoute>
                  <Videos />
                </PrivateRoute>
              }
            />
            <Route
              path="/line-chart"
              element={
                <PrivateRoute>
                  <LineChart />
                </PrivateRoute>
              }
            />
            <Route
              path="/bar-chart"
              element={
                <PrivateRoute>
                  <BarChart />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations"
              element={
                <PrivateRoute>
                  <OrganizationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations/create"
              element={
                <PrivateRoute>
                  <OrganizationCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations/:id"
              element={
                <PrivateRoute>
                  <OrganizationDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/organizations/edit/:id"
              element={
                <PrivateRoute>
                  <OrganizationEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets"
              element={
                <PrivateRoute>
                  <AssetsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/issues"
              element={
                <PrivateRoute>
                  <IssuesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/issues/:id"
              element={
                <PrivateRoute>
                  <IssueDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/:assetId/issues/new"
              element={
                <PrivateRoute>
                  <IssueCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/create"
              element={
                <PrivateRoute>
                  <AssetCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/create-bulk"
              element={
                <PrivateRoute>
                  <AssetBulkUpload />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/:id"
              element={
                <PrivateRoute>
                  <AssetDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/edit/:id"
              element={
                <PrivateRoute>
                  <AssetEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <EventsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/locations"
              element={
                <PrivateRoute>
                  <LocationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/locations/:id"
              element={
                <PrivateRoute>
                  <LocationDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <PrivateRoute>
                  <ReservationsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/reservation-reports"
              element={
                <PrivateRoute>
                  <ReservationReports />
                </PrivateRoute>
              }
            />
            <Route
              path="/resources-import"
              element={
                <PrivateRoute>
                  <RoleRoute allowed={[1, "Admin"]}>
                    <ImportResources />
                  </RoleRoute>
                </PrivateRoute>
              }
            />
            <Route
              path="/employee-dashboard"
              element={
                <PrivateRoute>
                  <EmployeeDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <PrivateRoute>
                  <CollectionsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections/create"
              element={
                <PrivateRoute>
                  <CollectionsCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <PrivateRoute>
                  <BookingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/bookings"
              element={
                <PrivateRoute>
                  <AssetBookingsCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections/:id"
              element={
                <PrivateRoute>
                  <CollectionDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections/edit/:id"
              element={
                <PrivateRoute>
                  <CollectionsEdit />
                </PrivateRoute>
              }
            />
            {/* Teams */}
            <Route
              path="/teams"
              element={
                <PrivateRoute>
                  <TeamsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/teams/:id"
              element={
                <PrivateRoute>
                  <TeamDetailPage />
                </PrivateRoute>
              }
            />
            {/* Admin Contacts */}
            <Route
              path="/admin/contacts"
              element={
                <PrivateRoute>
                  <ContactsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/contacts/new"
              element={
                <PrivateRoute>
                  <ContactCreate />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/contacts/:id/edit"
              element={
                <PrivateRoute>
                  <ContactEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/contacts/bulk"
              element={
                <PrivateRoute>
                  <ContactsBulkUpload />
                </PrivateRoute>
              }
            />
            <Route
              path="/assets/reports"
              element={
                <PrivateRoute>
                  <ReportsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <ReportsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports/peak-usage"
              element={
                <PrivateRoute>
                  <PeakUsageHeatmap />
                </PrivateRoute>
              }
            />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* QR Check-in Route (public) */}
          <Route path="/checkin/:markerId" element={<CheckinPage />} />
          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </Router>
    </>
  );
}
