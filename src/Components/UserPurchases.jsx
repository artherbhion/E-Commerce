// UserPurchases.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { BsCheckCircleFill, BsClockFill, BsXLg } from "react-icons/bs";
import "./UserPurchases.css";

function UserPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const fetchUserPurchases = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const db = getFirestore();
        const purchasesRef = collection(db, "purchases");
        const q = query(purchasesRef, where("userEmail", "==", currentUser.email));
        const querySnapshot = await getDocs(q);

        const purchasesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate()
        }));

        setPurchases(purchasesData);
      } catch (error) {
        console.error("Error fetching user purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPurchases();
  }, [auth.currentUser]);

  const filteredPurchases = purchases.filter(purchase => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return !purchase.status || purchase.status === "pending";
    if (activeTab === "approved") return purchase.status === "approved";
    if (activeTab === "rejected") return purchase.status === "rejected";
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <BsCheckCircleFill className="status-icon approved" />;
      case "rejected":
        return <BsXLg className="status-icon rejected" />;
      default:
        return <BsClockFill className="status-icon pending" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleString();
  };

  if (loading) return <div className="loading">Loading your purchases...</div>;

  return (
    <div className="user-purchases">
      <h2>Your Purchase History</h2>
      
      <div className="purchase-tabs">
        <button 
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All Purchases ({purchases.length})
        </button>
        <button 
          className={activeTab === "pending" ? "active" : ""}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({purchases.filter(p => !p.status || p.status === "pending").length})
        </button>
        <button 
          className={activeTab === "approved" ? "active" : ""}
          onClick={() => setActiveTab("approved")}
        >
          Approved ({purchases.filter(p => p.status === "approved").length})
        </button>
        <button 
          className={activeTab === "rejected" ? "active" : ""}
          onClick={() => setActiveTab("rejected")}
        >
          Rejected ({purchases.filter(p => p.status === "rejected").length})
        </button>
      </div>

      {filteredPurchases.length === 0 ? (
        <div className="no-purchases">
          {activeTab === "all" 
            ? "You haven't made any purchases yet."
            : `No ${activeTab} purchases found.`}
        </div>
      ) : (
        <div className="purchases-list">
          {filteredPurchases.map((purchase) => (
            <div 
              key={purchase.id} 
              className={`purchase-card status-${purchase.status || 'pending'}`}
              onClick={() => setSelectedPurchase(purchase)}
            >
              <div className="purchase-header">
                <div className="status-display">
                  {getStatusIcon(purchase.status)}
                  <span>{purchase.status || "Pending"}</span>
                </div>
                <div className="purchase-date">
                  Ordered on: {formatDate(purchase.timestamp)}
                </div>
              </div>
              
              <div className="purchase-body">
                <div className="product-image">
                  <img 
                    src={purchase.productImage} 
                    alt={purchase.productName}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100?text=Product';
                    }}
                  />
                </div>
                <div className="product-info">
                  <h3>{purchase.productName}</h3>
                  <div className="product-price">
                    Price: ₹{purchase.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPurchase && (
        <div className="purchase-details-modal">
          <div className="purchase-details-content">
            <button 
              className="modal-close" 
              onClick={() => setSelectedPurchase(null)}
            >
              <BsXLg />
            </button>
            
            <h2>Purchase Details</h2>
            
            <div className="purchase-header">
              <div className="status-badge">
                Status: <span className={`status-${selectedPurchase.status || 'pending'}`}>
                  {selectedPurchase.status || "Pending"}
                </span>
              </div>
              <div className="purchase-date">
                Ordered on: {formatDate(selectedPurchase.timestamp)}
              </div>
              {selectedPurchase.approvedAt && (
                <div className="approved-date">
                  Approved on: {formatDate(selectedPurchase.approvedAt)}
                </div>
              )}
            </div>

            <div className="details-grid">
              <div className="detail-section">
                <h3>Order Information</h3>
                <div className="product-detail">
                  <div className="product-image">
                    <img 
                      src={selectedPurchase.productImage} 
                      alt={selectedPurchase.productName}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150?text=Product+Image';
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <div className="product-name">{selectedPurchase.productName}</div>
                    <div className="product-price">
                      Price: ₹{selectedPurchase.price.toFixed(2)}
                    </div>
                    {selectedPurchase.description && (
                      <div className="product-description">
                        <p>{selectedPurchase.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Shipping Information</h3>
                <div className="detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedPurchase.userName || "Not provided"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">
                    {selectedPurchase.userAddress || "Not provided"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Mobile:</span>
                  <span className="detail-value">{selectedPurchase.userMobile || "Not provided"}</span>
                </div>
              </div>
            </div>

            <div className="admin-message">
              {selectedPurchase.status === "approved" ? (
                <p className="approved-message">
                  Your order has been approved and will be shipped soon.
                </p>
              ) : selectedPurchase.status === "rejected" ? (
                <p className="rejected-message">
                  Your order has been rejected. Please contact support for more information.
                </p>
              ) : (
                <p className="pending-message">
                  Your order is being processed. Please wait for admin approval.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPurchases;