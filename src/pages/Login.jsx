import styles from "../styles/Log.module.css"; 
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate(); 

  const handleLogin = () => {
    console.log("User logged in!");
    navigate("/home"); 
  };

  return (
    <div className={styles["wrapper-login"]}>
      <h1 className={styles["page-title"]}>Sistem Manajemen ATK di BAAK</h1>
      <img src="/logo.png" alt="Logo" className={styles["logo-login"]} />
      <div className={styles["login-container"]}>
        <div className={styles["social-login"]} onClick={handleLogin}>
          <button className={styles["social-button"]}>
            <img src="google.svg" alt="Google" className={styles["social-icon"]} />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;