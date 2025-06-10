// CardMain.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { BsFillHeartFill, BsXLg } from "react-icons/bs";
import { doc, setDoc, getDocs, getFirestore, collection, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import "./CardMain.css";

function CardMain({ imgSrc, title, hearts, price, user }) {
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [dynamicDescription, setDynamicDescription] = useState(null);
  const [userDetails, setUserDetails] = useState({
    name: "",
    address: "",
    mobile: ""
  });
  const [loading, setLoading] = useState(false);

  const handleCardClick = async () => {
    setShowModal(true);
    const db = getFirestore();
    
    try {
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("title", "==", title.trim()));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const productData = querySnapshot.docs[0].data();
        setDynamicDescription(productData.description || "No description available");
      } else {
        console.warn("No product found for title:", title);
        setDynamicDescription("Product not found");
      }
    } catch (error) {
      console.error("Error fetching product description:", error);
      setDynamicDescription("Failed to load description");
    }
  };

  const handlePurchaseClick = (e) => {
    e.stopPropagation();
    setShowPurchaseForm(true);
  };

  const handleUserDetailsChange = (e) => {
    const { name, value } = e.target;
    setUserDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    const auth = getAuth();
    const currentUser = auth.currentUser || user;

    if (!currentUser) {
      alert("Please sign in to make a purchase");
      setLoading(false);
      return;
    }

    // Validate user details
    if (!userDetails.name || !userDetails.address || !userDetails.mobile) {
      alert("Please fill all the required fields");
      setLoading(false);
      return;
    }

    // Basic mobile number validation
    if (!/^\d{10}$/.test(userDetails.mobile)) {
      alert("Please enter a valid 10-digit mobile number");
      setLoading(false);
      return;
    }

    try {
      const db = getFirestore();
      const purchasesRef = collection(db, "purchases");

      await setDoc(doc(purchasesRef), {
        userEmail: currentUser.email,
        userName: userDetails.name,
        userAddress: userDetails.address,
        userMobile: userDetails.mobile,
        productName: title,
        productImage: imgSrc,
        price: price,
        description: dynamicDescription || "No description available",
        timestamp: new Date(),
        status: "pending",
        adminApproved: false
      });

      alert("Purchase request submitted successfully! Admin will review your order.");
      setShowPurchaseForm(false);
      setUserDetails({
        name: "",
        address: "",
        mobile: ""
      });
    } catch (error) {
      console.error("Error recording purchase:", error);
      alert(`Purchase failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card_main" onClick={handleCardClick}>
        <img src={imgSrc} alt={title} className="card_main_img" />
        <div className="card_main_name">
          <h2>{title}</h2>
          <div className="card_main_icon">
            <BsFillHeartFill /> <span>{hearts}</span>
          </div>
        </div>
        <div className="stat">
          <p>Price: {price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
          <button onClick={handlePurchaseClick} className="purchase-btn">
            Purchase
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <BsXLg />
            </button>
            <div className="modal-image-container">
              <img src={imgSrc} alt={title} className="modal-image" />
            </div>
            <div className="modal-details">
              <h2>{title}</h2>
              <div className="modal-stats">
                <span className="hearts">
                  <BsFillHeartFill /> {hearts}
                </span>
                <span className="price">
                  {price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </span>
              </div>
              <div className="description-container">
                <h3>Product Details</h3>
                <p className="modal-description">
                  {dynamicDescription || "Loading description..."}
                </p>
              </div>
              <button onClick={handlePurchaseClick} className="purchase-btn modal-purchase-btn">
                Purchase Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showPurchaseForm && (
        <div className="modal-overlay" onClick={() => setShowPurchaseForm(false)}>
          <div className="purchase-form" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPurchaseForm(false)}>
              <BsXLg />
            </button>
            <h2>Complete Your Purchase</h2>
            <p>You're purchasing: <strong>{title}</strong></p>
            <p>Price: <strong>{price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></p>
            
            <form onSubmit={handlePurchaseSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={userDetails.name}
                  onChange={handleUserDetailsChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Shipping Address:</label>
                <textarea
                  id="address"
                  name="address"
                  value={userDetails.address}
                  onChange={handleUserDetailsChange}
                  required
                  placeholder="Enter your complete shipping address"
                  rows="4"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number:</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={userDetails.mobile}
                  onChange={handleUserDetailsChange}
                  required
                  placeholder="Enter your 10-digit mobile number"
                  pattern="[0-9]{10}"
                />
              </div>
              
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Submitting..." : "Submit Purchase Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

CardMain.propTypes = {
  imgSrc: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  hearts: PropTypes.number,
  price: PropTypes.number.isRequired,
  user: PropTypes.object,
};

CardMain.defaultProps = {
  hearts: 0,
};

export default CardMain;