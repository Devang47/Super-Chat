import "./styles/styles.css";
import { useState, useRef } from "react";

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

import SignIn from "./Components/SignIn";
import BadWords from "./Components/BadWords";

firebase.initializeApp({
  // your config
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return <>{user ? <ChatRoom /> : <SignIn signIn={signInWithGoogle} />}</>;
}

function ChatRoom() {
  const messagesRef = firestore.collection("messages");
  const usersRef = firestore.collection("users");

  const query = messagesRef.orderBy("createdAt").limit(25);
  const [messages] = useCollectionData(query, { idField: "id" });

  const [formValue, setFormValue] = useState("");
  const dummy = useRef();

  const sendMessage = async (e) => {
    e.preventDefault();
    for (let word of BadWords) {
      if (formValue.toLowerCase().split(" ").includes(word)) {
        setFormValue("Wanna get Banned?");
        return;
      }
    }
    if (formValue.trim() && formValue !== "Wanna get Banned?") {
      const { uid, photoURL, displayName, email } = auth.currentUser;

      await messagesRef.add({
        name: displayName,
        text: formValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL,
      });

      await usersRef.add({
        name: displayName,
        email_address: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        uid,
        photoURL,
      });

      setFormValue("");
      dummy.current.scrollIntoView({ behaviour: "smooth" });
    }
  };

  return (
    <section className="main_chat_app">
      <section className="section_header">
        <h1>Super-Chat</h1>
        <button className="sign_out" onClick={() => auth.signOut()}>
          Sign Out
        </button>
      </section>
      <section className="chat_main">
        <ul>
          {messages &&
            messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
          <li ref={dummy}></li>
        </ul>
      </section>
      <section className="input">
        <form onSubmit={sendMessage}>
          <input
            type="text"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
          />
          <button type="submit">
            <svg
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="38" height="38" rx="19" fill="white" />
              <path
                d="M30.9598 18.239L12.2257 8.85928C12.0789 8.78575 11.914 8.75629 11.7508 8.77444C11.5876 8.7926 11.4332 8.85759 11.306 8.9616C11.1846 9.0635 11.094 9.19728 11.0444 9.34792C10.9947 9.49855 10.988 9.66007 11.025 9.8143L13.2816 18.1452H22.9127V19.8506H13.2816L10.991 28.1559C10.9563 28.2847 10.9522 28.4198 10.9791 28.5505C11.0061 28.6811 11.0633 28.8037 11.1461 28.9082C11.2289 29.0127 11.3351 29.0962 11.456 29.1522C11.577 29.2081 11.7094 29.2349 11.8425 29.2303C11.9758 29.2295 12.1071 29.1973 12.2257 29.1365L30.9598 19.7568C31.0993 19.6852 31.2164 19.5765 31.2981 19.4426C31.3798 19.3087 31.4231 19.1548 31.4231 18.9979C31.4231 18.8409 31.3798 18.687 31.2981 18.5531C31.2164 18.4192 31.0993 18.3105 30.9598 18.239Z"
                fill="#292D44"
              />
            </svg>
          </button>
        </form>
      </section>
    </section>
  );
}

function ChatMessage({ message }) {
  const { text, uid } = message;
  const { photoURL } = auth.currentUser;

  const messageClass = uid === auth.currentUser.uid ? "sent" : "received";

  return (
    <li>
      <span className={`message_wrapper ${messageClass}`}>
        <img className="user_img" src={photoURL} alt=" " />
        <p className="message">{text}</p>
      </span>
    </li>
  );
}

export default App;
