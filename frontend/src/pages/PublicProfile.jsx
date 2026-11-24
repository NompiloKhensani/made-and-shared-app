import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import RecipeCard from "../components/RecipeCard";
import { FaUser } from "react-icons/fa6";
import api from "../services/api";
import { getRecipeKey } from "../utils/recipes";
import "./Kitchen.css";

function PublicProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/profiles/${username}`);
        setProfile(response.data.profile);
      } catch (requestError) {
        setProfile(null);
        setError(
          requestError.response?.data?.message ||
            "This profile is not available.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <main className="profile-page">
        <div className="page-container">
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="profile-page">
        <section className="page-intro">
          <div className="page-container">
            <h1>Profile unavailable</h1>
            <p>{error}</p>
          </div>
        </section>
      </main>
    );
  }

  const photo =
    typeof profile.profilePhoto === "string"
      ? profile.profilePhoto
      : profile.profilePhoto?.url;

  return (
    <main className="profile-page">
      <section className="page-intro">
        <div className="page-container">
          <div className="profile-header">
            {photo ? (
              <img src={photo} alt="" />
            ) : (
              <div className="settings-photo settings-photo-placeholder">
                <FaUser aria-hidden="true" />
              </div>
            )}
            <div>
              <h1>{profile.username}</h1>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container profile-body">
        {profile.recipes?.length ? (
          <div className="recipe-grid">
            {profile.recipes.map((recipe, index) => (
              <RecipeCard
                key={getRecipeKey(recipe, index)}
                recipe={{
                  ...recipe,
                  creator: {
                    ...recipe.creator,
                    username:
                      recipe.creator?.username || profile.username,
                  },
                }}
              />
            ))}
          </div>
        ) : (
          <div className="kitchen-empty">
            <p className="kitchen-empty-mark" aria-hidden="true">
              🍽
            </p>
            <h3>No published recipes yet</h3>
            <p>This cook has not shared a dish with the community.</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default PublicProfile;
