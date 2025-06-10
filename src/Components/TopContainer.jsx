import React, { useEffect, useState } from "react";
import { BiSearchAlt } from "react-icons/bi";
import { FaBell, FaChevronDown, FaUser, FaLock } from "react-icons/fa";
import AdminDashboard from "./AdminDashboard";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import PropTypes from 'prop-types';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword
} from "firebase/auth";
import Modal from "react-modal";
import "./TopContainer.css";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBMcbKO4ey1NBqpLjV2togpOwizCN0JhZw",
  authDomain: "admin-ffab5.firebaseapp.com",
  projectId: "admin-ffab5",
  storageBucket: "admin-ffab5.appspot.com",
  messagingSenderId: "663439390249",
  appId: "1:663439390249:web:799c3a4d2555637e124e38"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

Modal.setAppElement("#root");

function TopContainer({ onSearch }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    role: "user"
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser({
          email: user.email,
          uid: user.uid,
          role: user.email === "admin@gmail.com" ? "admin" : "user"
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      setIsLoginModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      setIsLoginModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    const mouseTarget = document.getElementById("menuChevron");
    const menuContainer = document.getElementById("menuContainer");

    const handleMouseEnter = () => {
      mouseTarget.style.transform = "rotate(180deg)";
      menuContainer.style.transform = "translateX(0px)";
    };

    const handleMouseLeave = () => {
      mouseTarget.style.transform = "rotate(0deg)";
      menuContainer.style.transform = "translateX(300px)";
    };

    if (mouseTarget && menuContainer) {
      mouseTarget.addEventListener("mouseenter", handleMouseEnter);
      menuContainer.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      if (mouseTarget && menuContainer) {
        mouseTarget.removeEventListener("mouseenter", handleMouseEnter);
        menuContainer.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="topContainer">
      <div className="inputBox">
        <input 
          type="text" 
          placeholder="Search items, collections" 
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            onSearch(e.target.value);
          }}
        />
        <i>
          <BiSearchAlt />
        </i>
      </div>

      <div className="profileContainer">
        <i className="profileIcon">
          <FaBell />
        </i>

        {user ? (
          <>
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="logout-btn"
              disabled={loading}
            >
              {loading ? "Signing out..." : "Logout"}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setIsLoginModalOpen(true);
              setIsSignupMode(false);
            }}
            className="login-btn"
          >
            Login / Sign Up
          </button>
        )}
        {error && <div className="error-message">{error}</div>}
      </div>

      <Modal
        isOpen={isLoginModalOpen}
        onRequestClose={() => setIsLoginModalOpen(false)}
        className="login-modal"
        overlayClassName="login-overlay"
      >
        <h2>{isSignupMode ? "Sign Up" : "Login"}</h2>
        <form onSubmit={isSignupMode ? handleSignup : handleLogin}>
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {!isSignupMode && (
            <div className="role-selection">
              <label>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={loginForm.role === "user"}
                  onChange={handleInputChange}
                />
                User
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={loginForm.role === "admin"}
                  onChange={handleInputChange}
                />
                Admin
              </label>
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (isSignupMode ? "Signing up..." : "Signing in...") : (isSignupMode ? "Sign Up" : "Login")}
          </button>

          <p className="toggle-auth-mode">
            {isSignupMode ? "Already have an account?" : "Don't have an account?"}{" "}
            <span onClick={() => setIsSignupMode(!isSignupMode)}>
              {isSignupMode ? "Login" : "Sign Up"}
            </span>
          </p>
        </form>
      </Modal>
    </div>
  );
}

TopContainer.propTypes = {
  user: PropTypes.object,
  onSearch: PropTypes.func.isRequired
};

export default TopContainer;