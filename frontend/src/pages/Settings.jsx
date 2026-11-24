import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser } from "react-icons/fa6";
import api from "../services/api";
import "./Kitchen.css";

function Settings() {
  const { user, setUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(user?.username || "");
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.isPrivate));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await api.put("/profiles/me", {
        username,
        isPrivate,
      });
      setUser((current) => ({ ...current, ...response.data.profile }));
      setMessage("Your settings have been saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to update your settings.",
      );
    }
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("profilePhoto", file);

    try {
      await api.post("/profiles/me/photo", formData);
      await refreshUser();
      setMessage("Your profile photo has been updated.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to upload that photo. Please try a JPG, PNG or WebP under 5MB.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    setError("");
    setMessage("");

    try {
      await api.delete("/profiles/me/photo");
      await refreshUser();
      setMessage("Your profile photo has been removed.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to remove your profile photo.",
      );
    }
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await api.delete("/profiles/me", {
        data: { password, confirmation },
      });
      setShowDelete(false);
      setShowSuccess(true);
      logout();
      setTimeout(() => navigate("/"), 1600);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to delete your account.",
      );
    }
  };

  return (
    <main className="settings-page">
      <section className="page-intro">
        <div className="page-container">
          <span className="home-eyebrow">YOUR ACCOUNT</span>
          <h1>Account settings</h1>
          <p>Photo, username, privacy, and permanent account deletion.</p>
        </div>
      </section>

      <div className="page-container settings-body">
        {(message || error) && !showDelete && (
          <p className={error ? "form-error" : ""}>
            {error || message}
          </p>
        )}

        <section className="settings-card">
          <h2>Profile photo</h2>
          {user?.profilePhoto ? (
            <img className="settings-photo" src={user.profilePhoto} alt="" />
          ) : (
            <div className="settings-photo settings-photo-placeholder">
              <FaUser aria-hidden="true" />
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} />
          {user?.profilePhoto && (
            <button type="button" className="danger-button" onClick={handleRemovePhoto}>
              Remove photo
            </button>
          )}
        </section>

        <form className="settings-form settings-card" onSubmit={handleSave}>
          <h2>Profile</h2>
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={30}
              required
            />
          </label>
          <label>
            Profile visibility
            <select
              value={isPrivate ? "private" : "public"}
              onChange={(event) => setIsPrivate(event.target.value === "private")}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </label>
          <p>
            A private profile hides your public page and published recipes
            from other people. Your drafts, saved recipes and notes stay in
            My Kitchen.
          </p>
          <button type="submit" className="primary-button">
            Save settings
          </button>
        </form>

        <section className="settings-card">
          <h2>Delete account</h2>
          <p>
            This permanently removes your account, recipes and notes.
            There is no deactivation option.
          </p>
          <button
            type="button"
            className="danger-button"
            onClick={() => setShowDelete(true)}
          >
            Delete my account
          </button>
        </section>
      </div>

      {showDelete && (
        <div
          className="delete-modal"
          onClick={() => {
            setShowDelete(false);
            setPassword("");
            setConfirmation("");
          }}
        >
          <form
            className="delete-modal-card"
            onSubmit={handleDelete}
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Permanently delete account?</h2>
            <p>
              This cannot be undone. Enter your password, then type DELETE to
              confirm.
            </p>
            {error && <p className="form-error">{error}</p>}
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label>
              Type DELETE
              <input
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                required
              />
            </label>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowDelete(false);
                  setPassword("");
                  setConfirmation("");
                }}
              >
                Cancel
              </button>
              <button type="submit" className="danger-button">
                Delete forever
              </button>
            </div>
          </form>
        </div>
      )}

      {showSuccess && (
        <div className="success-popup">
          <div className="success-popup-card">
            <h2>Account deleted</h2>
            <p>Your Made & Shared account has been removed.</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default Settings;
