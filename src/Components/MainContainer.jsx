import React, { useEffect, useState, useMemo } from "react";
import "./MainContainer.css";
import CardMain from "./CardMain";
import { collection, query, getDocs, getFirestore } from "firebase/firestore";
import PropTypes from "prop-types";

function MainContainer({ user, searchQuery }) {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const db = getFirestore();
        const productsRef = collection(db, "products");
        const productsQuery = query(productsRef);
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    
    // Apply category filter first
    if (activeCategory !== "ALL") {
      result = result.filter(product => 
        product.category && product.category.toUpperCase() === activeCategory.toUpperCase()
      );
    }
    
    // Then apply search filter
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(product => 
        (product.title && product.title.toLowerCase().includes(query)) || 
        (product.description && product.description.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [products, activeCategory, searchQuery]);

  const handleCategoryFilter = (category) => {
    setActiveCategory(category);
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="maincontainer">
      <div className="left">
        <div className="textContainer">
          <h1>Products</h1>
          <h2>{activeCategory === "ALL" ? "All Categories" : activeCategory}</h2>
          <p>Top Quality Products</p>
        </div>

        <div className="cards">
          <div className="filters">
            <div className="popular">
              <h2>Feed</h2>
              <button 
                className={`button ${activeCategory === "ALL" ? "active" : ""}`}
                onClick={() => handleCategoryFilter("ALL")}
              >
                Popular
              </button>
            </div>
            <div className="filter_buttons">
              {["ALL", "TOYS", "FOOD", "PETS", "Clothing"].map((category) => (
                <button
                  key={category}
                  className={`button ${activeCategory === category ? "active" : ""}`}
                  onClick={() => handleCategoryFilter(category)}
                >
                  {category === "ALL" ? "All" : category}
                </button>
              ))}
            </div>
          </div>

          <main>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <CardMain 
                  key={product.id}
                  imgSrc={product.imageUrl} 
                  title={product.title} 
                  hearts={product.hearts}
                  price={product.price}
                  user={user}
                />
              ))
            ) : (
              <div className="no-products">
                <p>
                  {searchQuery 
                    ? `No products found matching "${searchQuery}"`
                    : `No products found in ${activeCategory === "ALL" ? "any category" : activeCategory}`}
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

MainContainer.propTypes = {
  user: PropTypes.object,
  searchQuery: PropTypes.string
};

export default MainContainer;