import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { collapseRecipesByName, extractRecipeList } from "../utils/recipes";
import "./RecipeSearchBox.css";

function suggestionMeta(recipe) {
  return [
    recipe.category,
    recipe.variationCount > 1 ? `${recipe.variationCount} versions` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

// Live recipe suggestions. Debounces typing so we do not hit the API on every key.
function RecipeSearchBox({
  value,
  onChange,
  onSubmit,
  onResults,
  onClear,
  category = "",
  placeholder,
  ariaLabel,
  className,
  iconClassName,
}) {
  const navigate = useNavigate();
  const boxRef = useRef(null);
  // Skip the first empty-value effect so we do not clear URL filters on mount.
  const skipEmptyClear = useRef(true);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const query = value.trim();

    if (!query) {
      setSuggestions([]);
      setOpen(false);
      setActiveIndex(-1);
      if (!skipEmptyClear.current) {
        onClear?.();
      }
      skipEmptyClear.current = false;
      return;
    }

    skipEmptyClear.current = false;

    const timeoutId = setTimeout(async () => {
      try {
        const params = { search: query };

        if (category) {
          params.category = category;
        }

        const response = await api.get("/recipes/public", { params });
        const recipes = collapseRecipesByName(
          extractRecipeList(response.data),
        );
        setSuggestions(recipes.slice(0, 8));
        setOpen(true);
        setActiveIndex(-1);
        onResults?.(recipes, query);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [value, category]);

  useEffect(() => {
    const handleClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const chooseRecipe = (recipe) => {
    if (!recipe?._id) {
      return;
    }

    setOpen(false);
    navigate(`/recipes/${recipe._id}`);
  };

  const handleKeyDown = (event) => {
    if (!open || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (index) => (index - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      chooseRecipe(suggestions[activeIndex]);
    }
  };

  return (
    <form className={className} onSubmit={onSubmit} ref={boxRef}>
      <span className={iconClassName} aria-hidden="true">
        ⌕
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-expanded={open}
        autoComplete="off"
      />
      <button type="submit">Search</button>

      {open && suggestions.length > 0 && (
        <ul className="recipe-search-suggestions" role="listbox">
          {suggestions.map((recipe, index) => {
            const meta = suggestionMeta(recipe);

            return (
              <li key={recipe._id || index} role="option">
                <button
                  type="button"
                  className={
                    index === activeIndex
                      ? "recipe-search-suggestion is-active"
                      : "recipe-search-suggestion"
                  }
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseRecipe(recipe)}
                >
                  <span>{recipe.name}</span>
                  {meta ? <small>{meta}</small> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}

export default RecipeSearchBox;
