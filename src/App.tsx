import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';

// Pages
import { Posts } from './pages/Posts';
import { DataModels } from './pages/DataModels';
import { APIConnections } from './pages/APIConnections';
import { Pages } from './pages/Pages';
import { DynamicCRUD } from './pages/DynamicCRUD';
import { APIConsole } from './pages/APIConsole';
import { StaticPage } from './pages/StaticPage';
import { APIDocs } from './pages/APIDocs';

function AdminApp() {
  const [models, setModels] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all metadata for dynamic routing
    const qModels = query(collection(db, 'dataModels'));
    const qConns = query(collection(db, 'apiConnections'));
    const qPages = query(collection(db, 'pages'));

    const unsubModels = onSnapshot(qModels, (snap) => {
      setModels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'dataModels'));

    const unsubConns = onSnapshot(qConns, (snap) => {
      setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'apiConnections'));

    const unsubPages = onSnapshot(qPages, (snap) => {
      setCustomPages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'pages'));

    return () => {
      unsubModels();
      unsubConns();
      unsubPages();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Layout customPages={customPages}>
        <Routes>
          {/* Core Pages */}
          <Route path="/" element={<Posts />} />
          <Route path="/models" element={<DataModels />} />
          <Route path="/connections" element={<APIConnections />} />
          <Route path="/pages" element={<Pages models={models} connections={connections} />} />
          <Route path="/docs" element={<APIDocs models={models} />} />

          {/* Dynamic CRUD Routes */}
          <Route path="/crud/:collectionName" element={<DynamicCRUD models={models} />} />

          {/* Custom Pages Routes */}
          {customPages.map(page => {
            let element = <div className="p-12 text-center">Invalid Page Type</div>;
            
            if (page.type === 'static') {
              element = <StaticPage page={page} />;
            } else if (page.type === 'list') {
              const model = models.find(m => m.id === page.config.modelId);
              if (model) element = <DynamicCRUD models={models} />;
            } else if (page.type === 'api-console') {
              const conn = connections.find(c => c.id === page.config.connectionId);
              if (conn) element = <APIConsole connection={conn} />;
            }

            return (
              <Route 
                key={page.id} 
                path={`/p${page.path}`} 
                element={element} 
              />
            );
          })}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AdminApp />
    </ErrorBoundary>
  );
}


