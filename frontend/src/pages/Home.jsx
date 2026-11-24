import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import RecipeCard from "../components/RecipeCard";
import RecipeSearchBox from "../components/RecipeSearchBox";
import {
  CATEGORY_COVER_IMAGES,
  RECIPE_CATEGORIES,
} from "../constants/categories";
import api from "../services/api";
import {
  collapseRecipesByName,
  extractCategoryList,
  extractRecipeList,
  getRecipeKey,
} from "../utils/recipes";
import "./Home.css";

function Home() {
  const categoryTrackRef = useRef(null);
  const hoverScrollFrame = useRef(0);

  const [categories, setCategories] = useState(RECIPE_CATEGORIES);
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHomepage = async () => {
      try {
        const [categoryResult, recipeResult] = await Promise.allSettled([
          api.get("/recipes/categories"),
          api.get("/recipes/public"),
        ]);

        if (categoryResult.status === "fulfilled") {
          setCategories(
            extractCategoryList(categoryResult.value.data, RECIPE_CATEGORIES),
          );
        }

        if (recipeResult.status === "fulfilled") {
          setRecipes(extractRecipeList(recipeResult.value.data));
        } else {
          setError("We couldn't load recipes right now. Please try again.");
        }
      } catch {
        setError("Something went wrong while loading the homepage.");
      } finally {
        setLoading(false);
      }
    };

    loadHomepage();
  }, []);

  const loadRecipes = async (search = "", category = "") => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (category) {
        params.category = category;
      }

      const response = await api.get("/recipes/public", {
        params,
      });
      const list = extractRecipeList(response.data);
      setRecipes(search.trim() ? collapseRecipesByName(list) : list);
    } catch {
      setError("We couldn't find recipes right now. Please try again.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    loadRecipes(searchTerm, selectedCategory);
  };

  const handleCategoryClick = (category) => {
    const nextCategory = selectedCategory === category ? "" : category;

    setSelectedCategory(nextCategory);
    loadRecipes(searchTerm, nextCategory);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    loadRecipes("", "");
  };

  const stopHoverScroll = () => {
    if (hoverScrollFrame.current) {
      cancelAnimationFrame(hoverScrollFrame.current);
      hoverScrollFrame.current = 0;
    }
  };

  const startHoverScroll = (direction) => {
    const track = categoryTrackRef.current;

    if (!track) return;

    stopHoverScroll();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const speed = prefersReducedMotion ? 1.2 : 3.2;

    const step = () => {
      track.scrollLeft += direction * speed;

      const atStart = track.scrollLeft <= 0;
      const atEnd =
        track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;

      if ((direction < 0 && atStart) || (direction > 0 && atEnd)) {
        stopHoverScroll();
        return;
      }

      hoverScrollFrame.current = requestAnimationFrame(step);
    };

    hoverScrollFrame.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => stopHoverScroll();
  }, []);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-eyebrow">WELCOME TO MADE & SHARED</span>

          <h1>
            Find inspiration.
            <br />
            Make it your own.
            <br />
            <span>Share it with others.</span>
          </h1>

          <p>
            Come cook with us. Browse what people are making, try a recipe as
            it is, or tweak it until it tastes like home — then share yours too.
          </p>

          <RecipeSearchBox
            className="home-search"
            iconClassName="home-search-icon"
            value={searchTerm}
            onChange={setSearchTerm}
            onSubmit={handleSearch}
            category={selectedCategory}
            onResults={(recipes) => {
              setRecipes(recipes);
              setError("");
            }}
            onClear={() => loadRecipes("", selectedCategory)}
            placeholder="Search for a recipe..."
            ariaLabel="Search recipes by name"
          />
        </div>

        <div className="home-hero-decoration" aria-hidden="true">
          <div className="hero-blob hero-blob-coral" />
          <div className="hero-blob hero-blob-sage" />
          <div className="hero-dashed-ring" />

          <figure className="hero-photo hero-photo-main">
            <img
              src="https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=900&q=80"
              alt=""
            />
          </figure>

          <figure className="hero-photo hero-photo-mid">
            <img
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80"
              alt=""
            />
          </figure>

          <figure className="hero-photo hero-photo-small">
            <img
              src="https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&q=80"
              alt=""
            />
          </figure>

          <span className="hero-sticker hero-sticker-yum">Yum!</span>
          <span className="hero-sticker hero-sticker-share">Make it yours</span>
        </div>
      </section>

      <section className="home-section category-section">
        <div className="home-section-heading">
          <div>
            <span className="home-eyebrow">FIND SOMETHING DELICIOUS</span>
            <h2>Explore by Category</h2>
            <p>Browse recipes by the dishes you love.</p>
          </div>

          <div className="category-heading-actions">
            <Link to="/categories" className="text-link">
              View All Categories
            </Link>
          </div>
        </div>

        <div className="category-carousel-wrapper">
          <div className="carousel-controls">
            <button
              type="button"
              onMouseEnter={() => startHoverScroll(-1)}
              onMouseLeave={stopHoverScroll}
              onPointerDown={() => startHoverScroll(-1)}
              onPointerUp={stopHoverScroll}
              onPointerCancel={stopHoverScroll}
              onBlur={stopHoverScroll}
              aria-label="Scroll categories left"
            >
              &#8592;
            </button>
          </div>

          <div className="category-carousel" ref={categoryTrackRef}>
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={`category-card ${
                  selectedCategory === category ? "selected" : ""
                }`}
                onClick={() => handleCategoryClick(category)}
                aria-pressed={selectedCategory === category}
              >
                <img
                  src={CATEGORY_COVER_IMAGES[category]}
                  alt=""
                  loading="lazy"
                />
                <span>{category}</span>
              </button>
            ))}
          </div>

          <div className="carousel-controls">
            <button
              type="button"
              onMouseEnter={() => startHoverScroll(1)}
              onMouseLeave={stopHoverScroll}
              onPointerDown={() => startHoverScroll(1)}
              onPointerUp={stopHoverScroll}
              onPointerCancel={stopHoverScroll}
              onBlur={stopHoverScroll}
              aria-label="Scroll categories right"
            >
              &#8594;
            </button>
          </div>
        </div>
      </section>

      <section className="home-section browse-section" id="browse-recipes">
        <div className="home-section-heading browse-heading">
          <div>
            <span className="home-eyebrow">A LITTLE INSPIRATION</span>
            <h2>
              {selectedCategory ? selectedCategory : "Browse All Recipes"}
            </h2>
            <p>
              {selectedCategory
                ? `Explore recipes in ${selectedCategory}.`
                : "Discover something delicious to make today."}
            </p>
          </div>

          {(selectedCategory || searchTerm) && (
            <button
              type="button"
              className="clear-filters-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="home-message">
            <div className="loading-spinner" />
            <p>Finding something delicious...</p>
          </div>
        ) : error ? (
          <div className="home-message error-message">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => loadRecipes(searchTerm, selectedCategory)}
            >
              Try again
            </button>
          </div>
        ) : recipes.length === 0 ? (
          <div className="home-message">
            <h3>No recipes shared just yet.</h3>
            <p>
              {selectedCategory || searchTerm
                ? "Try another search or explore a different category."
                : "Publish a recipe and it will show up here for others to cook and recreate."}
            </p>
            {selectedCategory || searchTerm ? (
              <button
                type="button"
                className="clear-filters-button"
                onClick={clearFilters}
              >
                Show all recipes
              </button>
            ) : (
              <Link to="/create-recipe" className="clear-filters-button">
                Create a recipe
              </Link>
            )}
          </div>
        ) : (
          <div className="recipe-grid">
            {recipes.map((recipe, index) => (
              <RecipeCard
                key={getRecipeKey(recipe, index)}
                recipe={recipe}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Home;
