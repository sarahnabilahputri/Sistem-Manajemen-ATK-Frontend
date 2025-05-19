import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Log.module.css";

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Login = ( { setUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
      const url = new URL(window.location.href);
      if (url.pathname === "/callback") {
        const googleData = url.search;
        const callbackURL = `${API_BASE_URL}/api/auth/callback${googleData}`;
        console.log("GET ke backend:", callbackURL);
  
        fetch(callbackURL, {
          method: "POST"
        })
          .then(async (res) => {
            const rawText = await res.text();
            const contentType = res.headers.get("content-type");
  
            console.log("Response dari backend:", rawText);
            
            if (!res.ok) {
              throw new Error(`HTTP ${res.status}: ${rawText.slice(0, 100)}...`);
            }
  
            if (!contentType || !contentType.includes("application/json")) {
              throw new Error(`Expected JSON but got: ${rawText.slice(0, 100)}...`);
            }
  
            return JSON.parse(rawText);
          })
          .then((data) => {
            console.log("DATA DARI BACKEND:", data);
          
            const { access_token, token_type } = data;

            if (!access_token) {
              console.warn("Token tidak ada dalam response!");
              return;
            }
          
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("token_type", token_type);
          
            // 🔥 Fetch user langsung di sini
            return fetch(`${API_BASE_URL}/api/auth/authorize`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            });
          })
          .then((res) => res.json())
          .then((data) => {
            console.log("USER FETCHED:", data.user);
            if (data.user) {
              localStorage.setItem("user", JSON.stringify(data.user));
              setUser(data.user); // <-- 🔥 Tambahkan ini!
              navigate("/home");  // Biar langsung masuk ke dashboard
            }
          })          
          .catch((err) => {
            console.error("Login error:", err);
            alert("Login gagal: " + err.message);
            navigate("/");
          });
      }
    }, [navigate]);

  

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
