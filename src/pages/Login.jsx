import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Login = ({ setUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname === "/callback") {
      const googleData = url.search;
      const callbackURL = `${API_BASE_URL}/api/auth/callback${googleData}`;
      fetch(callbackURL, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      })
        .then(async res => {
          const text = await res.text();
          const ct = res.headers.get("content-type");
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0,100)}`);
          if (!ct || !ct.includes("application/json")) {
            throw new Error(`Expected JSON, got: ${text.slice(0,100)}`);
          }
          return JSON.parse(text);
        })
        .then(data => {
          const { access_token, token_type, user } = data;
          if (!access_token) throw new Error("No access_token in response");
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("token_type", token_type);
          localStorage.setItem("user", JSON.stringify(user));
          setUser(user);
         
          navigate("/home");
        })
        .catch(err => {
          console.error("Login error:", err);
          alert("Login gagal: " + err.message);
          navigate("/");
        });
    }
  }, [navigate, setUser]);

  return (
    <div className={styles["wrapper-login"]}>
      <h1 className={styles["page-title"]}>Sistem Manajemen ATK di BAAK</h1>
      <img src="/logo.png" alt="Logo" className={styles["logo-login"]} />
      <div className={styles["login-container"]}>
        <a href={`${API_BASE_URL}/api/auth/redirect?prompt=login`} className={styles["social-login"]}>
          <button className={styles["social-button"]}>
            <img src="google.svg" alt="Google" className={styles["social-icon"]} />
            Sign in with Google
          </button>
        </a>
      </div>
    </div>
  );
};

export default Login;
