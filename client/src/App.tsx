import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import Verify from "./pages/Verify"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Events from "./pages/Events"
import EventOverview from "./pages/EventOverview"
import Template from "./pages/Template"
import Event from "./pages/Event"
import Participants from "./pages/Participants"
import Registration from "./pages/Registration"
import CertificateVault from "./pages/CertificateVault"
import Register from "./pages/Register"

import ProtectedRoute from "./components/auth/ProtectedRoute"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify/:certificateId" element={<Verify />} />
        <Route path="/register/:eventSlug" element={<Register />} />

        {/* Organizer routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/events" element={<Events />} />

          <Route path="/event/new" element={<Event />} />

          <Route
            path="/events/:eventId"
            element={<EventOverview />}
          />

          <Route
            path="/events/:eventId/participants"
            element={<Participants />}
          />

          <Route
            path="/events/:eventId/registration"
            element={<Registration />}
          />

          <Route
            path="/events/:eventId/certificates"
            element={<CertificateVault />}
          />

          <Route path="/template" element={<Template />} />

          <Route
            path="/template/:eventId"
            element={<Template />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App