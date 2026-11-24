import { Link } from "react-router-dom";
import {
  CATEGORY_COVER_IMAGES,
  CATEGORY_DETAILS,
  RECIPE_CATEGORIES,
} from "../constants/categories";
import "./Categories.css";

function Categories() {
  return (
    <main className="categories-page">
      <section className="categories-intro">
        <div className="page-container">
          <span className="categories-eyebrow">EXPLORE MADE & SHARED</span>
          <h1>Find something delicious</h1>
          <p>
            Browse recipes cooks have shared, then make one your own.
          </p>
        </div>
      </section>

      <section className="categories-content page-container">
        <div className="categories-grid">
          {RECIPE_CATEGORIES.map((name) => (
            <Link
              to={`/discover?category=${encodeURIComponent(name)}`}
              className="category-page-card"
              key={name}
            >
              <div className="category-page-image">
                <img
                  src={CATEGORY_COVER_IMAGES[name]}
                  alt=""
                />
              </div>

              <div className="category-page-info">
                <h2>{name}</h2>
                <p>{CATEGORY_DETAILS[name]}</p>
                <span>Explore recipes &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Categories;
