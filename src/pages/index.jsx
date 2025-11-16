import { useEffect, useState } from 'react';
import Layout from "./Layout.jsx";
import LoginPage from "./LoginPage.jsx";
import SalleAttente from "./SalleAttente";
import Patients from "./Patients";
import DossierPatient from "./DossierPatient";
import Gestion from "./Gestion";
import GestionUtilisateurs from "./GestionUtilisateurs";
import Recettes from "./Recettes";
import DossiersRecents from "./DossiersRecents";
import RechercheAvancee from "./RechercheAvancee";
import DossiersATraiter from "./DossiersATraiter";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const PAGES = {
    SalleAttente: SalleAttente,
    Patients: Patients,
    DossierPatient: DossierPatient,
    Gestion: Gestion,
    GestionUtilisateurs: GestionUtilisateurs,
    Recettes: Recettes,
    DossiersRecents: DossiersRecents,
    RechercheAvancee: RechercheAvancee,
    DossiersATraiter: DossiersATraiter,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Protected Route wrapper
function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const isAuth = await base44.auth.isAuthenticated();
                setIsAuthenticated(isAuth);
            } catch {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <SalleAttente />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/SalleAttente" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <SalleAttente />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/Patients" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Patients />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/DossierPatient" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <DossierPatient />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/Gestion" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Gestion />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/GestionUtilisateurs" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <GestionUtilisateurs />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/Recettes" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Recettes />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/DossiersRecents" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <DossiersRecents />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/RechercheAvancee" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <RechercheAvancee />
                    </Layout>
                </ProtectedRoute>
            } />

            <Route path="/DossiersATraiter" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <DossiersATraiter />
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}