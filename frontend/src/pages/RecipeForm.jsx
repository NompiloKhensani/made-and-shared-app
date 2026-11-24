import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RECIPE_CATEGORIES } from "../constants/categories";
import api from "../services/api";
import "./RecipeForm.css";

const emptyIngredient = () => ({ name: "", quantity: "", optional: false });

function RecipeForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const basedOnId = searchParams.get("basedOn");
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState(RECIPE_CATEGORIES);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [preparationTime, setPreparationTime] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState([emptyIngredient()]);
  const [instructions, setInstructions] = useState([""]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [basedOn, setBasedOn] = useState(basedOnId || "");
  const [sourceTitle, setSourceTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/recipes/categories");
        const list = response.data.categories;
        if (Array.isArray(list) && list.length > 0) {
          setCategories(list);
        }
      } catch {
        setCategories(RECIPE_CATEGORIES);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const applyRecipe = (recipe, asAdaptation = false) => {
      setName(asAdaptation ? "" : recipe.name || "");
      setDescription(recipe.description || "");
      setCategory(
        RECIPE_CATEGORIES.includes(recipe.category) ? recipe.category : "",
      );
      setPreparationTime(recipe.preparationTime ?? "");
      setCookingTime(recipe.cookingTime ?? "");
      setServings(recipe.servings ?? "");
      setIngredients(
        recipe.ingredients?.length
          ? recipe.ingredients.map((ingredient) => ({
              name: ingredient.name || "",
              quantity: ingredient.quantity || "",
              optional: Boolean(ingredient.optional),
            }))
          : [emptyIngredient()],
      );
      setInstructions(
        recipe.instructions?.length ? recipe.instructions : [""],
      );
      if (!asAdaptation) {
        setExistingImages(recipe.images || []);
      }
      if (recipe.basedOn) {
        setBasedOn(recipe.basedOn._id || recipe.basedOn);
      }
    };

    const loadExisting = async () => {
      try {
        if (isEditing) {
          const response = await api.get(`/recipes/my-recipes/${id}`);
          applyRecipe(response.data.recipe);
          setIsPublished(Boolean(response.data.recipe.isPublished));
          if (response.data.recipe.basedOn) {
            setSourceTitle("This is your adaptation of another recipe.");
          }
          return;
        }

        if (basedOnId) {
          const response = await api.get(`/recipes/${basedOnId}`);
          applyRecipe(response.data.recipe, true);
          setBasedOn(response.data.recipe._id);
          setSourceTitle(
            `Based on ${response.data.recipe.name}. Give your version its own name.`,
          );
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "We couldn't load this recipe.",
        );
      }
    };

    loadExisting();
  }, [id, basedOnId, isEditing]);

  const updateIngredient = (index, field, value) => {
    setIngredients((current) =>
      current.map((ingredient, itemIndex) =>
        itemIndex === index ? { ...ingredient, [field]: value } : ingredient,
      ),
    );
  };

  const payload = () => ({
    name: name.trim(),
    description: description.trim(),
    category,
    preparationTime: Number(preparationTime) || 0,
    cookingTime: Number(cookingTime),
    servings: servings === "" ? undefined : Number(servings),
    ingredients: ingredients
      .filter((ingredient) => ingredient.name.trim() && ingredient.quantity.trim())
      .map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity.trim(),
        optional: ingredient.optional,
      })),
    instructions: instructions.map((step) => step.trim()).filter(Boolean),
    basedOn: basedOn || undefined,
  });

  const validate = () => {
    if (!name.trim() || name.trim().length > 100) {
      return "Recipe name is required and must be 100 characters or fewer.";
    }
    if (!RECIPE_CATEGORIES.includes(category)) {
      return "Please choose a category.";
    }
    if (existingImages.length + newImages.length === 0) {
      return "Please add a cover image.";
    }
    if (cookingTime === "" || Number(cookingTime) < 0) {
      return "Please add a cooking time.";
    }
    if (payload().ingredients.length === 0) {
      return "Please add at least one ingredient with a quantity.";
    }
    if (payload().instructions.length === 0) {
      return "Please add at least one instruction.";
    }
    return "";
  };

  const uploadImages = async (recipeId) => {
    if (newImages.length === 0) return;

    const formData = new FormData();
    newImages.forEach((file) => formData.append("images", file));
    await api.post(`/recipes/my-recipes/${recipeId}/images`, formData);
  };

  const saveRecipe = async (shouldPublish) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      let recipeId = id;

      if (isEditing) {
        await api.put(`/recipes/my-recipes/${id}`, payload());
      } else {
        const response = await api.post("/recipes", payload());
        recipeId = response.data.recipe._id;
      }

      await uploadImages(recipeId);

      if (shouldPublish && !isPublished) {
        await api.patch(`/recipes/my-recipes/${recipeId}/publish`);
      }

      navigate("/my-kitchen");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't save this recipe. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeExistingImage = async (imageId) => {
    try {
      await api.delete(`/recipes/my-recipes/${id}/images/${imageId}`);
      setExistingImages((current) =>
        current.filter((image) => image._id !== imageId),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to remove that image.",
      );
    }
  };

  return (
    <main className="recipe-form-page">
      <section className="page-intro">
        <div className="page-container">
          <span className="home-eyebrow">
            {isEditing ? "UPDATE YOUR RECIPE" : "SHARE SOMETHING DELICIOUS"}
          </span>
          <h1>{isEditing ? "Edit recipe" : "Create recipe"}</h1>
          <p className="recipe-form-intro">
            {sourceTitle ||
              "Add the details, keep it as a draft, or publish it for the community."}
          </p>
        </div>
      </section>

      <div className="page-container">
        <form
          className="recipe-form recipe-form-card"
          onSubmit={(event) => {
            event.preventDefault();
            saveRecipe(false);
          }}
        >
          {error && <p className="form-error">{error}</p>}

          <label>
            Recipe name
            <input
              value={name}
              maxLength={100}
              placeholder={
                basedOn ? "Name your version of this recipe" : "Recipe name"
              }
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>

          <label>
            Description
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              <option value="">Select a category</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="recipe-form-grid">
            <label>
              Prep time (minutes)
              <input
                type="number"
                min="0"
                value={preparationTime}
                onChange={(event) => setPreparationTime(event.target.value)}
              />
            </label>
            <label>
              Cooking time (minutes)
              <input
                type="number"
                min="0"
                value={cookingTime}
                onChange={(event) => setCookingTime(event.target.value)}
                required
              />
            </label>
            <label>
              Servings
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(event) => setServings(event.target.value)}
              />
            </label>
          </div>

          <div className="recipe-form-field">
            Ingredients
            {ingredients.map((ingredient, index) => (
              <div className="ingredient-row" key={index}>
                <input
                  placeholder="Name"
                  value={ingredient.name}
                  onChange={(event) =>
                    updateIngredient(index, "name", event.target.value)
                  }
                />
                <input
                  placeholder="e.g. 1 cup, 250 ml, a pinch"
                  value={ingredient.quantity}
                  onChange={(event) =>
                    updateIngredient(index, "quantity", event.target.value)
                  }
                />
                <label className="optional-chip">
                  <input
                    type="checkbox"
                    checked={ingredient.optional}
                    onChange={(event) =>
                      updateIngredient(index, "optional", event.target.checked)
                    }
                  />
                  Optional
                </label>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() =>
                    setIngredients((current) =>
                      current.length === 1
                        ? current
                        : current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setIngredients((current) => [...current, emptyIngredient()])
              }
            >
              Add ingredient
            </button>
          </div>

          <div className="recipe-form-field">
            Method
            {instructions.map((step, index) => (
              <div className="instruction-row" key={index}>
                <textarea
                  rows={2}
                  placeholder={`Step ${index + 1}`}
                  value={step}
                  onChange={(event) =>
                    setInstructions((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="danger-button"
                  onClick={() =>
                    setInstructions((current) =>
                      current.length === 1
                        ? current
                        : current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="secondary-button"
              onClick={() => setInstructions((current) => [...current, ""])}
            >
              Add step
            </button>
          </div>

          <div className="recipe-form-field">
            Cover image
            {existingImages.length > 0 && (
              <div className="existing-images">
                {existingImages.map((image) => (
                  <figure key={image._id || image.publicId}>
                    <img src={image.url} alt="" />
                    {isEditing && image._id && (
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image._id)}
                      >
                        ×
                      </button>
                    )}
                  </figure>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) =>
                setNewImages(Array.from(event.target.files || []))
              }
            />
          </div>

          <div className="recipe-form-actions">
            <Link to="/my-kitchen" className="recipe-form-cancel">
              Cancel
            </Link>
            <div className="recipe-form-actions-main">
              <button
                type="submit"
                className="secondary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save draft"}
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={saving}
                onClick={() => saveRecipe(true)}
              >
                {saving ? "Saving..." : "Publish recipe"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default RecipeForm;
