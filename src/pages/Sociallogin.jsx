import styles from "../styles/Log.module.css"; 
import { useNavigate } from "react-router-dom";
 
const Sociallogin = () => {
  const navigate = useNavigate(); 

  const handleLogin = () => {
    console.log("User logged in!");
    navigate("/home"); 
  };

  return (
    <div className={styles["social-login"]} onClick={handleLogin}>
      <button className={styles["social-button"]}>
        <img src="google.svg" alt="Google" className={styles["social-icon"]} />
        Sign in with Google
      </button>
    </div>
  );
};

export default Sociallogin;
