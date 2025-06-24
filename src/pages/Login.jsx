import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from '../pages/Api';
import styles from '../styles/Log.module.css';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Login = ({ setUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname === "/callback") {
      const googleData = url.search; // e.g. '?code=...&scope=...'
      const callbackURL = `${API_BASE_URL}/api/auth/callback${googleData}`;
      // Gunakan POST sesuai route backend
      axios.post(callbackURL)
        .then(res => {
          const data = res.data;
          const { access_token, token_type, user } = data;
          if (!access_token) throw new Error("No access_token in response");
          localStorage.setItem("access_token", access_token);
          localStorage.setItem("token_type", token_type);
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            setUser(user);
            return null;
          }
          // Jika backend tidak mengembalikan user langsung, fetch user
          return axios.get(`${API_BASE_URL}/api/auth/authorize`)
            .then(authRes => {
              const u = authRes.data.user;
              if (u) {
                localStorage.setItem("user", JSON.stringify(u));
                setUser(u);
              }
            });
        })
        .then(() => {
          navigate("/home");
        })
        .catch(err => {
          console.error("Login error:", err);
          const msg = err.response?.data?.message || err.message || 'Unknown error';
          alert("Login gagal: " + msg);
          navigate("/");
        });
    }
  }, [navigate, setUser]);

  return (
    <div className={styles['wrapper-login']}>
      <h1 className={styles['page-title']}>Sistem Manajemen ATK di BAAK</h1>
      <img src="/logo.png" alt="Logo" className={styles['logo-login']} />
      <div className={styles['login-container']}>
        <a href={`${API_BASE_URL}/api/auth/redirect?prompt=login`} className={styles['social-login']}>
          <button className={styles['social-button']}>
            <img src="google.svg" alt="Google" className={styles['social-icon']} />
            Sign in with Google
          </button>
        </a>
      </div>
    </div>
  );
};

export default Login;
