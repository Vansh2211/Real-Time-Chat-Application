import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import manualAxios from "../config/axiosConfig";
// import manualAxios from "/Users/juntrax/Desktop/Chatapp/frontend/src/config/axiosConfig.ts";
import "/Users/juntrax/Desktop/Chatapp/frontend/src/home.css";
import User from "/workspaces/Real-Time-Chat-Application/backend/src/models/User.ts";
import io from "socket.io-client"
import ChatBox from "../components/ChatBox";
import { IUser } from "/workspaces/Real-Time-Chat-Application/backend/src/models/User.ts"

type Message = {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  media?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  _id?: string;
};

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<IUser[]>([]);
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [loggedInUser, setLoggedInUser] = useState<IUser | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [users, setUsers] = useState<IUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  const navigate = useNavigate();

  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const socket = io("http://localhost:3000", {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Connected to WebSocket server");
  });

  socket.emit("send_messsage", messages);

  const Chat = ({ loggedInUser }: { loggedInUser: IUser }) => {
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
      socket.on("send_message", (msg: Message) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      });

      socket.on("receiveMessage", (msg: Message) => {
        console.log("Received message:", msg);
        setMessages((prevMessages) => [...prevMessages, msg]);
      });

      return () => {
        socket.off("receiveMessage");
      };
    }, []);
  };

  useEffect(() => {
    const user = localStorage.getItem("user") || "";

    if (user) {
      try {
        setLoggedInUser(JSON.parse(user));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        setLoggedInUser(null);
      }
    } else {
      setLoggedInUser(null);
    }
  }, []);

  useEffect(() => {
    console.log("loggedIn User: ", loggedInUser);
  }, [loggedInUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await manualAxios.get("/action/users");
        const data = response.data;

        let filteredUsers = data.users.filter(
          (user: IUser) => user._id !== loggedInUser?._id && !user.online
        );

        setAllUsers(filteredUsers);

        console.log("All Users:", filteredUsers);

        let filteredOnlineusers = data.users.filter(
          (user: IUser) => user._id !== loggedInUser?._id && user.online
        );
        setOnlineUsers(filteredOnlineusers);
      } catch (error) {
        console.error("Error fetching all users:", error);
      }
    };

    fetchUsers();
  }, [loggedInUser]);

  const handleLogout = async () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("mobile");
    localStorage.removeItem("user");
    alert("Logout successful!");
    navigate("/Login");
    const response = await manualAxios.post("/auth/logout", {
      email: loggedInUser?.email,
    });

    socket.disconnect();
  };

  const handleHome = () => {
    console.log("Home clicked");
    navigate("/main");
  };

  const handleSelectedUser = (user: IUser) => {
    setSelectedUser(user);
    setMessages([]);
  };

  // Ensure messages are received once, outside the function
  useEffect(() => {
    socket.on("receive_message", (msg: Message) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const handleMenu = () => {
    console.log("Menu clicked");
    setIsMenuVisible((prev) => !prev);
  };

  const handleChat = () => {
    console.log("chat clicked");
    setIsChatVisible((prev) => !prev);
  };

  const handleProfile = () => {
    console.log("Profile clicked");
    navigate("/profile");
  };

  // const handleGroup = async () => {
  //   const response = await manualAxios.post("/action/group");

  //   const data = response.data;
  // };

  return (
    // <div className="inhome-container">
    // {/* Main Content */}
    <div className="main-content">
      <button onClick={handleLogout} className="logout-button" title="Logout">
        <b>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#e8eaed"
          >
            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
          </svg>
        </b>
      </button>
      <nav className="main-header">
        <h1>V-ChatApp</h1>
      </nav>

      {loggedInUser && (
        <p className="welcome-message">
          Welcome {loggedInUser?.name}!<span className="user-name"></span>
        </p>
      )}

      <button
        onClick={handleMenu}
        className="menu-button"
        title="click to menu bar..."
      >
        {isMenuVisible ? "Close Menu" : " Click to Open Menu"}
      </button>
      {/* Sidebar */}
      {isMenuVisible && (
        <div className="sidebar">
          <h2 className="sidebar-title">Menu</h2>
          <ul className="sidebar-list">
            <li className="sidebar-item" onClick={handleHome}>
              Home
            </li>
            <li className="sidebar-item" onClick={handleProfile}>
              Profile
            </li>

            <li className="sidebar-item" onClick={handleLogout}>
              Logout
            </li>
          </ul>
        </div>
      )}

      <div className="chat-container">
        <div className="online-users">
          {loggedInUser && (
            <b>
              <p className="welcome-user"></p>
            </b>
          )}

          {/* <div className="group">
            <button>Create Group</button>
          </div> */}

          <h3>Online Users:</h3>
          {Array.isArray(onlineUsers) && onlineUsers.length > 0 ? (
            <ul className="user-list">
              {onlineUsers.map((user, index) => (
                <li key={user.id || index} className="user-item">
                  <div className="user-avatar">👤</div>
                  <div className="user-info">
                    {user.name ? user.name : "Unknown User"}
                  </div>

                  <button
                    className="request-chat-button"
                    title="Click to start chatting"
                    onClick={() => handleSelectedUser(user)}
                  >
                    Chat
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users online</p>
          )}

          <h3>Users:</h3>
          {Array.isArray(allUsers) && allUsers.length > 0 ? (
            <ul className="alluser-list">
              {allUsers.map((user, index) => (
                <li key={user.id || index} className="user-item">
                  <div className="user-avatar">👤</div>
                  <div className="user-info">
                    {user.name ? user.name : "Unknown User"}
                  </div>

                  <button
                    className="request-chat-button2"
                    title="Click to start chatting"
                    onClick={() => handleSelectedUser(user)}
                  >
                    Chat
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p></p>
          )}
        </div>

        {selectedUser && (
          <ChatBox
            selectedUser={selectedUser}
            loggedInUser={loggedInUser}
            socket={socket}
          />
        )}
      </div>
    </div>
    // </div>
  );
};

export default Home;
