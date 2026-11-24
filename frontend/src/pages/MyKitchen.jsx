import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RecipeCard from "../components/RecipeCard";
import api from "../services/api";
import { getRecipeId, getRecipeKey } from "../utils/recipes";
import "./Kitchen.css";

const TABS = [
  { id: "published", label: "Published" },
  { id: "drafts", label: "Drafts" },
  { id: "adaptations", label: "Adaptations" },
  { id: "saved", label: "Saved" },
  { id: "notes", label: "Private notes" },
];

const EMPTY_COPY = {
  published: {
    title: "Your published recipes will live here",
    body: "Share a dish with the community whenever you are ready.",
    action: "Create a recipe",
    to: "/create-recipe",
  },
  drafts: {
    title: "No drafts on the counter",
    body: "Start a recipe and save it as a draft until it feels right.",
    action: "Start a draft",
    to: "/create-recipe",
  },
  adaptations: {
    title: "Make a recipe your own",
    body: "Open any dish and create your version without changing the original.",
    action: "Browse recipes",
    to: "/discover",
  },
  saved: {
    title: "Nothing saved yet",
    body: "Heart a recipe you want to cook later and it will wait for you here.",
    action: "Browse recipes",
    to: "/discover",
  },
};

function MyKitchen() {
  const [tab, setTab] = useState("published");
  const [recipes, setRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadKitchen = async () => {
    setLoading(true);
    setError("");

    try {
      const [recipeResult, savedResult, noteResult] = await Promise.all([
        api.get("/recipes/my-recipes"),
        api.get("/saved-recipes"),
        api.get("/private-notes"),
      ]);

      setRecipes(recipeResult.data.recipes || []);
      setSavedRecipes(
        (savedResult.data.savedRecipes || [])
          .map((item) => item.recipe)
          .filter(Boolean),
      );
      setNotes(noteResult.data.privateNotes || noteResult.data.notes || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't load your kitchen.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKitchen();
  }, []);

  const published = useMemo(
    () => recipes.filter((recipe) => recipe.isPublished && !recipe.basedOn),
    [recipes],
  );
  const drafts = useMemo(
    () => recipes.filter((recipe) => !recipe.isPublished && !recipe.basedOn),
    [recipes],
  );
  const adaptations = useMemo(
    () => recipes.filter((recipe) => recipe.basedOn),
    [recipes],
  );

  const visibleRecipes = {
    published,
    drafts,
    adaptations,
    saved: savedRecipes,
  }[tab];

  const handleDelete = async () => {
    if (!pendingDeleteId) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await api.delete(`/recipes/my-recipes/${pendingDeleteId}`);
      setPendingDeleteId("");
      await loadKitchen();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't delete that recipe. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleUnsave = async (recipeId) => {
    try {
      await api.delete(`/saved-recipes/${recipeId}`);
      await loadKitchen();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't remove that saved recipe.",
      );
    }
  };

  const journalNotes = useMemo(
    () => notes.filter((note) => !note.recipe),
    [notes],
  );
  const recipeNotes = useMemo(
    () => notes.filter((note) => note.recipe),
    [notes],
  );

  const handleUnpublish = async (recipeId) => {
    setError("");

    try {
      await api.patch(`/recipes/my-recipes/${recipeId}/unpublish`);
      await loadKitchen();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't move that recipe back to drafts.",
      );
    }
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    setError("");

    try {
      if (editingNoteId) {
        await api.put(`/private-notes/${editingNoteId}`, {
          title: noteTitle,
          content: noteContent,
        });
        setEditingNoteId("");
      } else {
        await api.post("/private-notes", {
          title: noteTitle,
          content: noteContent,
        });
      }

      setNoteTitle("");
      setNoteContent("");
      await loadKitchen();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't save that note. Please try again.",
      );
    }
  };

  const startEditNote = (note) => {
    setEditingNoteId(note._id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const handleDeleteNote = async (noteId) => {
    setError("");

    try {
      await api.delete(`/private-notes/${noteId}`);
      if (editingNoteId === noteId) {
        setEditingNoteId("");
        setNoteTitle("");
        setNoteContent("");
      }
      await loadKitchen();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't delete that note. Please try again.",
      );
    }
  };

  const renderNoteCard = (note, options = {}) => {
    const linkedRecipe =
      note.recipe && typeof note.recipe === "object" ? note.recipe : null;

    return (
      <article className="note-card" key={note._id}>
        <h3>{note.title}</h3>
        <p>{note.content}</p>
        {linkedRecipe?._id && (
          <p className="note-recipe-link">
            For{" "}
            <Link to={`/recipes/${linkedRecipe._id}`}>{linkedRecipe.name}</Link>
          </p>
        )}
        {note.recipe && !linkedRecipe?._id && (
          <p className="note-recipe-link">
            Linked to a recipe that is no longer available.
          </p>
        )}
        <div className="kitchen-actions">
          {options.allowEdit && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => startEditNote(note)}
            >
              Edit
            </button>
          )}
          {linkedRecipe?._id && (
            <Link
              to={`/recipes/${linkedRecipe._id}`}
              className="secondary-button"
            >
              Open recipe
            </Link>
          )}
          <button
            type="button"
            className="danger-button"
            onClick={() => handleDeleteNote(note._id)}
          >
            Delete
          </button>
        </div>
      </article>
    );
  };

  const empty = EMPTY_COPY[tab];

  return (
    <main className="kitchen-page">
      <section className="page-intro">
        <div className="page-container">
          <span className="home-eyebrow">YOUR RECIPES</span>
          <h1>My Kitchen</h1>
          <p>Published recipes, drafts, saved dishes and private notes.</p>
        </div>
      </section>

      <div className="page-container kitchen-body">
        <div className="kitchen-tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading your kitchen...</p>
        ) : tab === "notes" ? (
          <>
            <section className="note-group">
              <h2>Journal</h2>
              <p>
                Write whatever you like — meal ideas, shopping lists, or a
                cooking diary. These notes are not tied to a recipe.
              </p>
              <form className="note-form" onSubmit={handleAddNote}>
                <input
                  placeholder="Note title"
                  value={noteTitle}
                  onChange={(event) => setNoteTitle(event.target.value)}
                  required
                />
                <textarea
                  rows={4}
                  placeholder="A thought, a list, or something you want to remember..."
                  value={noteContent}
                  onChange={(event) => setNoteContent(event.target.value)}
                  required
                />
                <div className="kitchen-actions">
                  <button type="submit" className="primary-button">
                    {editingNoteId ? "Update note" : "Save journal note"}
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
              {journalNotes.length === 0 ? (
                <div className="kitchen-empty kitchen-empty-inline">
                  <p className="kitchen-empty-mark" aria-hidden="true">
                    ✎
                  </p>
                  <h3>Start a cooking diary</h3>
                  <p>Shopping lists, meal ideas, or whatever you want to remember.</p>
                </div>
              ) : (
                <div className="note-list">
                  {journalNotes.map((note) =>
                    renderNoteCard(note, { allowEdit: true }),
                  )}
                </div>
              )}
            </section>

            <section className="note-group">
              <h2>Recipe notes</h2>
              <p>
                Notes you add on a recipe page stay with that recipe, so they
                are waiting for you the next time you cook it.
              </p>
              {recipeNotes.length === 0 ? (
                <div className="kitchen-empty kitchen-empty-inline">
                  <p className="kitchen-empty-mark" aria-hidden="true">
                    ♡
                  </p>
                  <h3>Notes for next time</h3>
                  <p>Open any recipe and add a private note there.</p>
                </div>
              ) : (
                <div className="note-list">{recipeNotes.map(renderNoteCard)}</div>
              )}
            </section>
          </>
        ) : visibleRecipes.length === 0 ? (
          <div className="kitchen-empty">
            <p className="kitchen-empty-mark" aria-hidden="true">
              🍽
            </p>
            <h3>{empty?.title}</h3>
            <p>{empty?.body}</p>
            {empty?.to && (
              <Link to={empty.to} className="primary-button">
                {empty.action}
              </Link>
            )}
          </div>
        ) : (
          <div className="recipe-grid">
            {visibleRecipes.map((recipe, index) => (
              <div key={getRecipeKey(recipe, index)}>
                <RecipeCard recipe={recipe} />
                <div className="kitchen-actions">
                  {tab !== "saved" && (
                    <>
                      <Link
                        to={`/recipes/${recipe._id}/edit`}
                        className="secondary-button"
                      >
                        Edit
                      </Link>
                      {recipe.isPublished && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            handleUnpublish(getRecipeId(recipe));
                          }}
                        >
                          Unpublish
                        </button>
                      )}
                      <button
                        type="button"
                        className="danger-button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setPendingDeleteId(getRecipeId(recipe));
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {tab === "saved" && (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleUnsave(recipe._id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingDeleteId && (
        <div className="delete-modal">
          <div className="delete-modal-card">
            <h2>Delete this recipe?</h2>
            <p>This cannot be undone. Saved copies and notes on it will go too.</p>
            {error && <p className="form-error">{error}</p>}
            <div className="delete-modal-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={deleting}
                onClick={() => setPendingDeleteId("")}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger-button"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MyKitchen;
