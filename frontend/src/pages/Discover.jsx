import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RecipeCard from "../components/RecipeCard";
import RecipeSearchBox from "../components/RecipeSearchBox";
import { RECIPE_CATEGORIES } from "../constants/categories";
import api from "../services/api";
import {
  collapseRecipesByName,
  extractCategoryList,
  extractRecipeList,
  getRecipeKey,
} from "../utils/recipes";
import "./Discover.css";

function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "";
  const queryFromUrl = searchParams.get("q") || "";

  const [categories, setCategories] = useState(RECIPE_CATEGORIES);
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState(queryFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
    setSearchTerm(queryFromUrl);
  }, [categoryFromUrl, queryFromUrl]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/recipes/categories");
        setCategories(extractCategoryList(response.data, RECIPE_CATEGORIES));
      } catch {
        setCategories(RECIPE_CATEGORIES);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      setError("");

      try {
        const publicParams = {};

        if (queryFromUrl.trim()) {
          publicParams.search = queryFromUrl.trim();
        }

        if (categoryFromUrl) {
          publicParams.category = categoryFromUrl;
        }

        const response = await api.get("/recipes/public", {
          params: publicParams,
        });

        const list = extractRecipeList(response.data);
        setRecipes(
          queryFromUrl.trim() ? collapseRecipesByName(list) : list,
        );
      } catch {
        setRecipes([]);
        setError("We couldn't find recipes right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, [categoryFromUrl, queryFromUrl, reloadToken]);

  const updateFilters = (nextSearch, nextCategory) => {
    const nextParams = {};

    if (nextSearch.trim()) {
      nextParams.q = nextSearch.trim();
    }

    if (nextCategory) {
      nextParams.category = nextCategory;
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateFilters(searchTerm, selectedCategory);
  };

  const handleCategoryClick = (category) => {
    const nextCategory = selectedCategory === category ? "" : category;
    setSelectedCategory(nextCategory);
    updateFilters(searchTerm, nextCategory);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = Boolean(selectedCategory || queryFromUrl);

  return (
    <main className="discover-page">
      <section className="discover-intro">
        <div className="page-container">
          <span className="discover-eyebrow">FIND YOUR NEXT FAVOURITE</span>
          <h1>Discover recipes</h1>
          <p>
            Browse what cooks in the community have shared, then recreate it
            in your own kitchen.
          </p>

          <RecipeSearchBox
            className="discover-search"
            iconClassName="discover-search-icon"
            value={searchTerm}
            onChange={setSearchTerm}
            onSubmit={handleSearch}
            category={selectedCategory}
            onResults={(recipes) => {
              setRecipes(recipes);
              setError("");
            }}
            onClear={() => updateFilters("", selectedCategory)}
            placeholder="Search recipes by name or keyword..."
            ariaLabel="Search recipes by name"
          />
        </div>
      </section>

      <section className="discover-content page-container">
        <div className="discover-filters">
          <div>
            <h2>Browse by category</h2>
            <p>Filter recipes shared by the community.</p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="discover-clear-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="discover-category-chips" role="list">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={`discover-chip ${
                selectedCategory === category ? "selected" : ""
              }`}
              onClick={() => handleCategoryClick(category)}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="discover-message">
            <div className="discover-spinner" />
            <p>Finding something delicious...</p>
          </div>
        ) : error ? (
          <div className="discover-message discover-error">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
            >
              Try again
            </button>
          </div>
        ) : recipes.length === 0 ? (
          <div className="discover-message">
            <h3>No recipes shared just yet.</h3>
            <p>
              {hasActiveFilters
                ? "Try another search or category."
                : "Be the first to publish a recipe for others to cook and recreate."}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="discover-clear-button"
                onClick={clearFilters}
              >
                Show all recipes
              </button>
            ) : (
              <Link to="/create-recipe" className="discover-clear-button">
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

export default Discover;
