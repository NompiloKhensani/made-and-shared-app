import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRecipeCookName, getRecipeId } from "../utils/recipes";
import "./RecipeCard.css";

function getRecipePath(recipe) {
  const id = getRecipeId(recipe);
  return id ? `/recipes/${id}` : "/discover";
}

function RecipeCard({ recipe }) {
  const { user } = useAuth();
  const path = getRecipePath(recipe);
  const imageUrl = recipe?.images?.[0]?.url || "";
  const isAdaptation = Boolean(recipe.basedOn);
  const cookName = getRecipeCookName(recipe, user);
  const totalTime =
    (Number(recipe.preparationTime) || 0) + (Number(recipe.cookingTime) || 0);
  const servings = Number(recipe.servings) || 0;
  const metaBits = [
    totalTime > 0 ? `${totalTime} min` : null,
    servings > 0 ? `${servings} serving${servings === 1 ? "" : "s"}` : null,
  ].filter(Boolean);

  return (
    <article className="recipe-card">
      <Link to={path} className="recipe-card-image">
        {imageUrl && <img src={imageUrl} alt="" loading="lazy" />}
        {recipe.category && (
          <span className="recipe-card-category">{recipe.category}</span>
        )}
      </Link>

      <div className="recipe-card-content">
        {(isAdaptation || metaBits.length > 0) && (
          <div className="recipe-card-meta">
            {isAdaptation && (
              <span className="recipe-source-badge adaptation">Adaptation</span>
            )}
            {metaBits.length > 0 && (
              <span className="recipe-card-stats">{metaBits.join(" · ")}</span>
            )}
          </div>
        )}

        <h3>
          <Link to={path}>{recipe.name}</Link>
        </h3>

        {recipe.description && (
          <p className="recipe-card-description">{recipe.description}</p>
        )}

        <div className="recipe-card-footer">
          <span>{cookName ? `By: ${cookName}` : ""}</span>
          <Link to={path} className="recipe-card-link">
            View recipe →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default RecipeCard;
