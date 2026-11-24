import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Categories from "./pages/Categories";
import RecipeDetails from "./pages/RecipeDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyKitchen from "./pages/MyKitchen";
import RecipeForm from "./pages/RecipeForm";
import Settings from "./pages/Settings";
import PublicProfile from "./pages/PublicProfile";
import Footer from "./components/Footer";

function NotFoundPage() {
  return (
    <main>
      <section className="page-intro">
        <div className="page-container">
          <h1>Page not found</h1>
          <p>That page does not exist. Use the menu to get back to the kitchen.</p>
        </div>
      </section>
    </main>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <div className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recipes/:id" element={<RecipeDetails />} />
          <Route path="/profiles/:username" element={<PublicProfile />} />
          <Route
            path="/my-kitchen"
            element={
              <ProtectedRoute>
                <MyKitchen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-recipe"
            element={
              <ProtectedRoute>
                <RecipeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipes/:id/edit"
            element={
              <ProtectedRoute>
                <RecipeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </>
  );
}

export default App;
