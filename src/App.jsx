// App.js
import { useState, useEffect } from "react";
import "./App.css";
import Container from "./Components/Container";
import AdminDashboard from "./Components/AdminDashboard";
import TopContainer from "./Components/TopContainer";
import UserPurchases from "./Components/UserPurchases"; // Import the UserPurchases component
import { getAuth, onAuthStateChanged } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("products"); // Track which view to show

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          email: user.email,
          uid: user.uid,
          role: user.email === "admin@gmail.com" ? "admin" : "user"
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      <TopContainer user={user} setUser={setUser} />
      
      {/* Main content area */}
      <div className="main-content">
        {user?.role === "admin" ? (
          <AdminDashboard />
        ) : (
          <>
            {/* User view toggle buttons */}
            {user && (
              <div className="user-view-toggle">
                <button
                  className={activeView === "products" ? "active" : ""}
                  onClick={() => setActiveView("products")}
                >
                  Products
                </button>
                <button
                  className={activeView === "purchases" ? "active" : ""}
                  onClick={() => setActiveView("purchases")}
                >
                  My Purchases
                </button>
              </div>
            )}
            
            {/* Display either products or purchases based on activeView */}
            {activeView === "products" ? (
              <Container user={user} setUser={setUser} />
            ) : (
              <UserPurchases user={user} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;