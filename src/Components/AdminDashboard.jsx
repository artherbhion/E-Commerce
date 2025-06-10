import React, { useEffect, useState } from "react";
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc, getFirestore } from "firebase/firestore";
import { BsXLg, BsCheckCircleFill } from "react-icons/bs";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("purchases");
  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    description: "",
    imageUrl: "",
    category: ""
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore();
        
        // Fetch purchases
        const purchasesRef = collection(db, "purchases");
        const purchasesQuery = query(purchasesRef);
        const purchasesSnapshot = await getDocs(purchasesQuery);
        const purchasesData = purchasesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate()
        }));
        
        // Fetch products
        const productsRef = collection(db, "products");
        const productsQuery = query(productsRef);
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));
        
        setPurchases(purchasesData);
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (!newProduct.title || !newProduct.price || !newProduct.description || !newProduct.imageUrl || !newProduct.category) {
      setError("Please fill all fields including the image URL and category");
      return;
    }

    try {
      new URL(newProduct.imageUrl);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setError("Please enter a valid image URL");
      return;
    }

    try {
      const db = getFirestore();
      
      const productData = {
        title: newProduct.title,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        imageUrl: newProduct.imageUrl,
        category: newProduct.category,
        hearts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await addDoc(collection(db, "products"), productData);
      
      const productsRef = collection(db, "products");
      const productsQuery = query(productsRef);
      const productsSnapshot = await getDocs(productsQuery);
      const updatedProducts = productsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      
      setProducts(updatedProducts);
      setNewProduct({
        title: "",
        price: "",
        description: "",
        imageUrl: "",
        category: ""
      });
      
      setSuccessMessage("Product added successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      
    } catch (error) {
      console.error("Error adding product:", error);
      setError(error.message || "Failed to add product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const db = getFirestore();
      await deleteDoc(doc(db, "products", productId));
      
      setProducts(products.filter(product => product.id !== productId));      
      setSuccessMessage("Product deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting product:", error);
      setError("Failed to delete product");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({
      id: product.id,
      title: product.title,
      price: product.price.toString(),
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category || ""
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    if (!editingProduct.title || !editingProduct.price || !editingProduct.description || !editingProduct.imageUrl || !editingProduct.category) {
      setError("Please fill all fields including the image URL and category");
      return;
    }

    try {
      new URL(editingProduct.imageUrl);
    }// eslint-disable-next-line no-unused-vars
     catch (e) {
      setError("Please enter a valid image URL");
      return;
    }

    try {
      const db = getFirestore();
      const productRef = doc(db, "products", editingProduct.id);
      
      await updateDoc(productRef, {
        title: editingProduct.title,
        price: parseFloat(editingProduct.price),
        description: editingProduct.description,
        imageUrl: editingProduct.imageUrl,
        category: editingProduct.category,
        updatedAt: new Date()
      });
      
      setProducts(products.map(product => 
        product.id === editingProduct.id ? {
          ...product,
          title: editingProduct.title,
          price: parseFloat(editingProduct.price),
          description: editingProduct.description,
          imageUrl: editingProduct.imageUrl,
          category: editingProduct.category,
          updatedAt: new Date()
        } : product
      ));
      
      setEditingProduct(null);
      setSuccessMessage("Product updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating product:", error);
      setError("Failed to update product");
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingProduct) {
      setEditingProduct(prev => ({ ...prev, [name]: value }));
    } else {
      setNewProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleApprovePurchase = async (purchaseId) => {
    try {
      const db = getFirestore();
      const purchaseRef = doc(db, "purchases", purchaseId);
      
      await updateDoc(purchaseRef, {
        status: "approved",
        adminApproved: true,
        approvedAt: new Date()
      });
      
      setPurchases(purchases.map(purchase => 
        purchase.id === purchaseId ? {
          ...purchase,
          status: "approved",
          adminApproved: true,
          approvedAt: new Date()
        } : purchase
      ));
      
      setSuccessMessage("Purchase approved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error approving purchase:", error);
      setError("Failed to approve purchase");
    }
  };

  const handleRejectPurchase = async (purchaseId) => {
    if (!window.confirm("Are you sure you want to reject this purchase?")) {
      return;
    }

    try {
      const db = getFirestore();
      const purchaseRef = doc(db, "purchases", purchaseId);
      
      await updateDoc(purchaseRef, {
        status: "rejected",
        adminApproved: false,
        rejectedAt: new Date()
      });
      
      setPurchases(purchases.map(purchase => 
        purchase.id === purchaseId ? {
          ...purchase,
          status: "rejected",
          adminApproved: false,
          rejectedAt: new Date()
        } : purchase
      ));
      
      setSuccessMessage("Purchase rejected successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error rejecting purchase:", error);
      setError("Failed to reject purchase");
    }
  };

  const handleViewPurchaseDetails = (purchase) => {
    setSelectedPurchase(purchase);
  };

  const handleClosePurchaseDetails = () => {
    setSelectedPurchase(null);
  };

  const filteredPurchases = purchases.filter(purchase => {
    const searchLower = searchTerm.toLowerCase();
    return (
      purchase.userEmail.toLowerCase().includes(searchLower) ||
      purchase.productName.toLowerCase().includes(searchLower) ||
      purchase.userName?.toLowerCase().includes(searchLower) ||
      purchase.userMobile?.includes(searchTerm) ||
      purchase.status?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) return <div className="loading">Loading data...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-tabs">
        <button 
          className={activeTab === "purchases" ? "active" : ""}
          onClick={() => setActiveTab("purchases")}
        >
          Purchase Requests
        </button>
        <button 
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          Product Management
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {activeTab === "purchases" && (
        <div className="purchases-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search purchases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="purchases-table">
            <h2>Purchase Requests ({filteredPurchases.length})</h2>
            {filteredPurchases.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td>
                        <div className="user-info">
                          <div className="user-email">{purchase.userEmail}</div>
                          {purchase.userName && (
                            <div className="user-name">{purchase.userName}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="product-info">
                          <div className="product-name">{purchase.productName}</div>
                          {purchase.productImage && (
                            <img 
                              src={purchase.productImage} 
                              alt={purchase.productName}
                              className="product-thumbnail"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/50?text=Image';
                              }}
                            />
                          )}
                        </div>
                      </td>
                      <td>₹{purchase.price.toFixed(2)}</td>
                      <td>{purchase.timestamp?.toLocaleString()}</td>
                      <td className={`status-cell status-${purchase.status || 'pending'}`}>
                        {purchase.status || "Pending"}
                      </td>
                      <td className="actions-cell">
                        <button 
                          onClick={() => handleViewPurchaseDetails(purchase)}
                          className="view-btn"
                        >
                          Details
                        </button>
                        {(!purchase.status || purchase.status === "pending") && (
                          <div className="approval-buttons">
                            <button 
                              onClick={() => handleApprovePurchase(purchase.id)}
                              className="approve-btn"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectPurchase(purchase.id)}
                              className="reject-btn"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-results">
                {searchTerm ? "No matching purchases found" : "No purchase requests yet"}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="products-management">
          <div className="add-product-form">
            <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
            <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={editingProduct ? editingProduct.title : newProduct.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Product name"
                />
              </div>
              <div className="form-group">
                <label>Price (₹):</label>
                <input
                  type="number"
                  name="price"
                  value={editingProduct ? editingProduct.price : newProduct.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={editingProduct ? editingProduct.description : newProduct.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Product description"
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Category:</label>
                <select
                  name="category"
                  value={editingProduct ? editingProduct.category : newProduct.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="TOYS">TOYS</option>
                  <option value="FOOD">FOOD</option>
                  <option value="PETS">PETS</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Image URL:</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={editingProduct ? editingProduct.imageUrl : newProduct.imageUrl}
                  onChange={handleInputChange}
                  required
                  placeholder="https://example.com/image.jpg"
                />
                {(editingProduct?.imageUrl || newProduct.imageUrl) && (
                  <div className="image-preview">
                    <p>Image Preview:</p>
                    <img 
                      src={editingProduct ? editingProduct.imageUrl : newProduct.imageUrl} 
                      alt="Preview" 
                      className="preview-thumbnail"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150?text=Invalid+Image';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="form-buttons">
                {editingProduct ? (
                  <>
                    <button type="submit" className="submit-btn">
                      Update Product
                    </button>
                    <button 
                      type="button" 
                      onClick={handleCancelEdit}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="submit" className="submit-btn">
                    Add Product
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="products-list">
            <h2>Existing Products ({products.length})</h2>
            {products.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Hearts</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img 
                          src={product.imageUrl} 
                          alt={product.title} 
                          className="product-thumbnail"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100?text=Image+Error';
                          }}
                        />
                      </td>
                      <td>{product.title}</td>
                      <td>₹{product.price.toFixed(2)}</td>
                      <td>{product.category}</td>
                      <td>{product.hearts}</td>
                      <td>{product.createdAt?.toLocaleDateString()}</td>
                      <td>
                        <button 
                          onClick={() => handleEditProduct(product)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No products found.</p>
            )}
          </div>
        </div>
      )}

      {selectedPurchase && (
        <div className="purchase-details-modal">
          <div className="purchase-details-content">
            <button 
              className="modal-close" 
              onClick={handleClosePurchaseDetails}
            >
              <BsXLg />
            </button>
            
            <h2>Purchase Order Details</h2>
            
            <div className="purchase-header">
              <div className="status-badge">
                Status: <span className={`status-${selectedPurchase.status || 'pending'}`}>
                  {selectedPurchase.status || "Pending"}
                </span>
              </div>
              <div className="purchase-date">
                Ordered on: {selectedPurchase.timestamp?.toLocaleString()}
              </div>
              {selectedPurchase.approvedAt && (
                <div className="approved-date">
                  Approved on: {selectedPurchase.approvedAt.toLocaleString()}
                </div>
              )}
            </div>

            <div className="details-grid">
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedPurchase.userName || "Not provided"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedPurchase.userEmail}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Mobile:</span>
                  <span className="detail-value">{selectedPurchase.userMobile || "Not provided"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Shipping Address:</span>
                  <span className="detail-value">
                    {selectedPurchase.userAddress || "Not provided"}
                  </span>
                </div>
              </div>

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
            </div>

            {(!selectedPurchase.status || selectedPurchase.status === "pending") && (
              <div className="approval-actions">
                <button 
                  onClick={() => {
                    handleApprovePurchase(selectedPurchase.id);
                    handleClosePurchaseDetails();
                  }}
                  className="approve-btn"
                >
                  <BsCheckCircleFill /> Approve Order
                </button>
                <button 
                  onClick={() => {
                    handleRejectPurchase(selectedPurchase.id);
                    handleClosePurchaseDetails();
                  }}
                  className="reject-btn"
                >
                  Reject Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;