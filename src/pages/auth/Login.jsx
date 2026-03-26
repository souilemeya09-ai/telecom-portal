import { useState } from "react";
import userLogo from "../../assets/userr.png";
import { login } from "../../api/api.js";
import "../../styles/Login.css";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      const token = data.token;
      localStorage.setItem("token", token);
      const role = data.role;
      localStorage.setItem("role", role);

      // Décodage JWT (exemple si besoin)
      // const decoded = jwtDecode.default(token);
      // console.log(decoded);

      navigate("/");
    } catch (err) {
      setError("Nom d'utilisateur ou mot de passe incorrect");
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-content">
        <div className="login-card">
          <div className="login-logo">
            <img src={userLogo} alt="User" />
          </div>
          <h2>Login</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                id="email"
                type="email"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe:</label>
              <input
                id="password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>


            <button type="submit">Submit</button>
          </form>

          {error && <p className="error">{error}</p>}
          <div className="forgot-password">
            <Link to="/forgot-password">Mot de passe oublié ?</Link>
          </div>
        </div>
      </div>

    
    </div>
  );
};

export default Login;