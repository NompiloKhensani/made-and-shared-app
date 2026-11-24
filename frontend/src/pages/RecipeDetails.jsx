import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser } from "react-icons/fa6";
import RecipeCard from "../components/RecipeCard";
import api from "../services/api";
import { getRecipeCookName, getRecipeKey } from "../utils/recipes";
import "./RecipeDetails.css";

function formatDate(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [variations, setVariations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);

  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [recipeNotes, setRecipeNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [editingNoteId, setEditingNoteId] = useState("");

  const { isLoggedIn, user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const fetchRecipe = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/recipes/${id}`);

        if (!isMounted) return;

        const fetchedRecipe = response.data.recipe;

        setRecipe(fetchedRecipe);
        setVariations(response.data.variations || []);
        setActiveImage(0);
      } catch (err) {
        if (!isMounted) return;

        setVariations([]);
        setError(
          err.response?.data?.message ||
            "We couldn't load this recipe. Please try again."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchRecipe();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Check whether the logged-in user has saved this recipe.
  useEffect(() => {
    let isMounted = true;

    const checkSavedStatus = async () => {
      if (!isLoggedIn || !recipe?._id) {
        setIsSaved(false);
        return;
      }

      try {
        const response = await api.get("/saved-recipes");

        const savedRecipes = response.data.savedRecipes || [];

        const alreadySaved = savedRecipes.some(
          (savedItem) =>
            String(savedItem.recipe?._id) === String(recipe._id)
        );

        if (isMounted) {
          setIsSaved(alreadySaved);
        }
      } catch {
        if (isMounted) {
          setIsSaved(false);
        }
      }
    };

    checkSavedStatus();

    return () => {
      isMounted = false;
    };
  }, [recipe, isLoggedIn]);

  useEffect(() => {
    let isMounted = true;

    const loadRecipeNotes = async () => {
      if (!isLoggedIn || !recipe?._id) {
        setRecipeNotes([]);
        return;
      }

      try {
        const response = await api.get("/private-notes", {
          params: { recipeId: recipe._id },
        });

        if (isMounted) {
          setRecipeNotes(response.data.privateNotes || []);
        }
      } catch {
        if (isMounted) {
          setRecipeNotes([]);
        }
      }
    };

    loadRecipeNotes();

    return () => {
      isMounted = false;
    };
  }, [recipe, isLoggedIn]);

  const handleSaveRecipe = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (!recipe?._id) return;

    try {
      setSaveLoading(true);
      setSaveError("");

      if (isSaved) {
        await api.delete(`/saved-recipes/${recipe._id}`);
        setIsSaved(false);
      } else {
        await api.post("/saved-recipes", {
          recipeId: recipe._id,
        });

        setIsSaved(true);
      }
    } catch (err) {
      setSaveError(
        err.response?.data?.message ||
          "Unable to update your saved recipes. Please try again."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    setNoteMessage("");

    try {
      if (editingNoteId) {
        const response = await api.put(`/private-notes/${editingNoteId}`, {
          title: noteTitle,
          content: noteContent,
          recipeId: recipe._id,
        });
        setRecipeNotes((current) =>
          current.map((note) =>
            note._id === editingNoteId ? response.data.privateNote : note,
          ),
        );
        setEditingNoteId("");
        setNoteMessage("Your note on this recipe has been updated.");
      } else {
        const response = await api.post("/private-notes", {
          title: noteTitle,
          content: noteContent,
          recipeId: recipe._id,
        });
        setRecipeNotes((current) => [response.data.privateNote, ...current]);
        setNoteMessage("Saved. You'll see this note the next time you open this recipe.");
      }
      setNoteTitle("");
      setNoteContent("");
    } catch (err) {
      setNoteMessage(
        err.response?.data?.message || "Unable to save that note.",
      );
    }
  };

  const startEditNote = (note) => {
    setEditingNoteId(note._id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteMessage("");
  };

  const handleDeleteRecipeNote = async (noteId) => {
    try {
      await api.delete(`/private-notes/${noteId}`);
      setRecipeNotes((current) => current.filter((note) => note._id !== noteId));
      if (editingNoteId === noteId) {
        setEditingNoteId("");
        setNoteTitle("");
        setNoteContent("");
      }
    } catch (err) {
      setNoteMessage(
        err.response?.data?.message || "Unable to delete that note.",
      );
    }
  };

  if (loading) {
    return (
      <main className="recipe-details-state">
        <div className="recipe-spinner"></div>
        <p>Preparing your recipe...</p>
      </main>
    );
  }

  if (error || !recipe) {
    return (
      <main className="recipe-details-state">
        <h2>Recipe unavailable</h2>
        <p>{error || "We couldn't find this recipe."}</p>
        <Link to="/discover" className="recipe-back-button">
          Back to Discover
        </Link>
      </main>
    );
  }

  const isAdaptation = Boolean(recipe.basedOn);
  const originalRecipe =
    recipe.basedOn && typeof recipe.basedOn === "object"
      ? recipe.basedOn
      : null;
  const originalIsPublic =
    originalRecipe && !originalRecipe.creator?.isPrivate;

  const images = (recipe.images || []).filter((image) => image.url);

  const creatorPhoto =
    typeof recipe.creator?.profilePhoto === "string"
      ? recipe.creator.profilePhoto
      : recipe.creator?.profilePhoto?.url;
  const creatorName = getRecipeCookName(recipe, user);

  const publishedDate = formatDate(recipe.publishedAt);

  const preparationTime = Number(recipe.preparationTime) || 0;
  const cookingTime = Number(recipe.cookingTime) || 0;
  const totalTime = preparationTime + cookingTime;

  return (
    <main className="recipe-details-page">
      <div className="page-container">
        <div className="recipe-breadcrumbs">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/discover">Discover</Link>
          <span>/</span>
          <span>{recipe.name}</span>
        </div>

        <section className="recipe-details-header">
          <div className="recipe-title-area">
            <span className="recipe-category-label">
              {recipe.category}
            </span>
            {isAdaptation && (
              <span className="recipe-source-badge adaptation">Adaptation</span>
            )}

            <h1>{recipe.name}</h1>

            {isAdaptation && originalIsPublic && (
              <p className="recipe-description">
                Adapted from{" "}
                <Link to={`/recipes/${originalRecipe._id}`}>
                  {originalRecipe.name}
                </Link>
              </p>
            )}
            {isAdaptation && !originalIsPublic && (
              <p className="recipe-description">
                This is a personal version of another recipe.
              </p>
            )}

            {recipe.description && (
              <p className="recipe-description">
                {recipe.description}
              </p>
            )}

            <div className="recipe-author">
              {creatorPhoto ? (
                <img
                  src={creatorPhoto}
                  alt={creatorName}
                  className="recipe-author-photo"
                />
              ) : (
                <span className="recipe-author-photo recipe-author-photo-placeholder">
                  <FaUser aria-hidden="true" />
                </span>
              )}

              {creatorName ? (
                <div className="recipe-author-byline">
                  <span>By:</span>{" "}
                  {recipe.creator?.username ? (
                    <Link to={`/profiles/${recipe.creator.username}`}>
                      <strong>{creatorName}</strong>
                    </Link>
                  ) : (
                    <strong>{creatorName}</strong>
                  )}
                </div>
              ) : null}

              {publishedDate && (
                <>
                  <span className="recipe-author-divider">·</span>
                  <span className="recipe-published-date">
                    {publishedDate}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="recipe-header-actions">
            <button
              type="button"
              className={`recipe-action-button ${
                isSaved ? "saved" : ""
              }`}
              onClick={handleSaveRecipe}
              disabled={saveLoading}
            >
              {saveLoading
                ? "Please wait..."
                : isSaved
                  ? "♥ Saved"
                  : "♡ Save Recipe"}
            </button>

            <button
              type="button"
              className="recipe-action-button recipe-pdf-button"
              onClick={handleDownloadPDF}
            >
              ↓ Download PDF
            </button>
          </div>
        </section>

        {saveError && (
          <p className="recipe-save-error">{saveError}</p>
        )}

        <section className="recipe-main-content">
          <div className="recipe-visual-area">
            {images.length > 0 ? (
              <>
                <div className="recipe-main-image">
                  <img
                    src={images[activeImage]?.url}
                    alt={recipe.name}
                  />
                </div>

                {images.length > 1 && (
                  <div className="recipe-image-thumbnails">
                    {images.map((image, index) => (
                      <button
                        type="button"
                        key={image.publicId || index}
                        className={
                          activeImage === index ? "active" : ""
                        }
                        onClick={() => setActiveImage(index)}
                        aria-label={`View recipe image ${index + 1}`}
                      >
                        <img src={image.url} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="recipe-image-placeholder">
                <span>Made & Shared</span>
                <p>A delicious creation shared with our community.</p>
              </div>
            )}

          </div>

          <aside className="recipe-quick-info">
            <h2>Recipe Overview</h2>

            <div className="recipe-time-grid">
              <div className="recipe-info-item">
                <span className="recipe-info-icon">◷</span>
                <div>
                  <span>Preparation</span>
                  <strong>{preparationTime} min</strong>
                </div>
              </div>

              <div className="recipe-info-item">
                <span className="recipe-info-icon">♨</span>
                <div>
                  <span>Cooking</span>
                  <strong>{cookingTime} min</strong>
                </div>
              </div>

              <div className="recipe-info-item">
                <span className="recipe-info-icon">◴</span>
                <div>
                  <span>Total time</span>
                  <strong>{totalTime} min</strong>
                </div>
              </div>

              {recipe.servings && (
                <div className="recipe-info-item">
                  <span className="recipe-info-icon">♧</span>
                  <div>
                    <span>Servings</span>
                    <strong>{recipe.servings}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="recipe-overview-category">
              <span>Category</span>
              <strong>{recipe.category}</strong>
            </div>
          </aside>
        </section>

        <section className="recipe-instructions-section">
          <div className="recipe-ingredients">
            <div className="recipe-section-heading">
              <span>WHAT YOU NEED</span>
              <h2>Ingredients</h2>
            </div>

            <ul className="recipe-ingredient-list">
              {(recipe.ingredients || []).map((ingredient, index) => (
                <li key={ingredient._id || index}>
                  <span className="ingredient-name">
                    {ingredient.name}
                    {ingredient.optional && (
                      <small> (optional)</small>
                    )}
                  </span>

                  <strong>{ingredient.quantity}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="recipe-method">
            <div className="recipe-section-heading">
              <span>LET'S GET COOKING</span>
              <h2>Method</h2>
              <p>Follow these steps to make your dish.</p>
            </div>

            <ol className="recipe-instruction-list">
              {(recipe.instructions || []).map((instruction, index) => (
                <li key={index}>
                  <span className="instruction-number">
                    {index + 1}
                  </span>

                  <p>{instruction}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="private-note-section">
          <h2>Your notes for this recipe</h2>
          <p>
            Keep substitutions, timing, and what to try next time. These notes
            stay private and show up whenever you come back to this recipe.
          </p>

          {!isLoggedIn ? (
            <p>
              <Link to="/login">Log in</Link> to keep private notes on this
              recipe.
            </p>
          ) : (
            <>
              {recipeNotes.length > 0 && (
                <div className="recipe-note-list">
                  {recipeNotes.map((note) => (
                    <article className="recipe-note-card" key={note._id}>
                      <h3>{note.title}</h3>
                      <p>{note.content}</p>
                      <div className="recipe-note-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => startEditNote(note)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => handleDeleteRecipeNote(note._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <form className="private-note-form" onSubmit={handleAddNote}>
                {noteMessage && <p>{noteMessage}</p>}
                <input
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                  placeholder="Note title"
                  required
                />
                <textarea
                  rows={3}
                  value={noteContent}
                  onChange={(event) => setNoteContent(event.target.value)}
                  placeholder="Substitutions, timing, or what you'd try next time."
                  required
                />
                <div className="recipe-note-actions">
                  <button type="submit" className="secondary-button">
                    {editingNoteId ? "Update note" : "Save note for this recipe"}
                  </button>
                  {editingNoteId && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setEditingNoteId("");
                        setNoteTitle("");
                        setNoteContent("");
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </section>

        {variations.length > 0 && (
          <section className="recipe-variations">
            <h2>Other versions</h2>
            <p>
              Cooks have shared {variations.length + 1} takes on this recipe.
              Open another version to compare.
            </p>
            <div className="recipe-grid">
              {variations.map((variation, index) => (
                <RecipeCard
                  key={getRecipeKey(variation, index)}
                  recipe={variation}
                />
              ))}
            </div>
          </section>
        )}

        <section className="recipe-bottom-message">
          <h2>Made something delicious?</h2>
          <p>
            Put your own spin on a recipe, make it your own and share
            your version with the Made & Shared community.
          </p>
          <Link to={`/create-recipe?basedOn=${recipe._id}`}>
            Make it your own
          </Link>
        </section>
      </div>
    </main>
  );
}

export default RecipeDetails;
